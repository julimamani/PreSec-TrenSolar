package com.app.agtech.integration;

import com.app.agtech.exception.MarketDataException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.net.URI;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Outbound adapter for the Cámara Arbitral de Cereales (Bolsa de Comercio de
 * Rosario) board-price endpoint, which publishes the official cash price for
 * poroto in ARS/t. The quality norms themselves are only published as PDF
 * documents, so export tolerances live in the export-standards module; this
 * client only reads the bean board price.
 *
 * <p>The endpoint is not a formally versioned API, so the response is parsed
 * tolerantly: any JSON object that names a poroto entry contributes a price
 * when it carries a positive numeric value under a known price key. An empty
 * result lets the market service fall back to the configured regional spot.</p>
 */
@Component
public class CacPizarraClient {

    private static final List<String> NAME_KEYS = List.of(
            "especie", "grano", "rubro", "producto", "nombre", "descripcion"
    );
    private static final List<String> PRICE_KEYS = List.of(
            "precio", "pizarra", "valor", "cotizacion", "price", "ultimo", "cierre"
    );

    private final RestClient restClient;
    private final String consultasUrl;

    public CacPizarraClient(
            @Qualifier("marketRestClient") RestClient restClient,
            @Value("${api.cac.pizarra-url:https://www.cac.bcr.com.ar/es/precios-pizarra/consultas}")
            String consultasUrl
    ) {
        this.restClient = restClient;
        this.consultasUrl = consultasUrl;
    }

    /**
     * Best-effort poroto board price in ARS per tonne. Empty when the endpoint
     * answers but no poroto entry with a usable price is found.
     */
    public Optional<BigDecimal> fetchPorotoPizarraArs() {
        JsonNode root;
        try {
            root = restClient.get()
                    .uri(URI.create(consultasUrl))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw new MarketDataException(
                    "Cámara Arbitral pizarra returned HTTP " + exception.getStatusCode().value(),
                    exception
            );
        } catch (ResourceAccessException exception) {
            throw new MarketDataException("Cámara Arbitral pizarra is unavailable", exception);
        } catch (RestClientException exception) {
            throw new MarketDataException("The Cámara Arbitral request could not be completed", exception);
        }

        if (root == null) {
            throw new MarketDataException("Cámara Arbitral pizarra returned an empty response");
        }
        return extractPorotoPrice(root);
    }

    private Optional<BigDecimal> extractPorotoPrice(JsonNode root) {
        List<JsonNode> porotoEntries = new ArrayList<>();
        Deque<JsonNode> pending = new ArrayDeque<>();
        pending.add(root);

        while (!pending.isEmpty()) {
            JsonNode node = pending.poll();
            if (node.isObject()) {
                if (namesPoroto(node)) {
                    porotoEntries.add(node);
                }
                node.properties().forEach(entry -> pending.add(entry.getValue()));
            } else if (node.isArray()) {
                node.forEach(pending::add);
            }
        }

        // Prefer the alubia quote when several poroto entries are published.
        return porotoEntries.stream()
                .filter(entry -> namesPoroto(entry) && stringValues(entry).anyMatch(v -> v.contains("alubia")))
                .findFirst()
                .or(() -> porotoEntries.stream().findFirst())
                .flatMap(this::extractPrice);
    }

    private boolean namesPoroto(JsonNode object) {
        return NAME_KEYS.stream().anyMatch(key -> {
            JsonNode value = object.get(key);
            return value != null && value.isString()
                    && value.stringValue().toLowerCase(java.util.Locale.ROOT).contains("poroto");
        });
    }

    private java.util.stream.Stream<String> stringValues(JsonNode object) {
        List<String> values = new ArrayList<>();
        for (Iterator<Map.Entry<String, JsonNode>> it = object.properties().iterator(); it.hasNext(); ) {
            JsonNode value = it.next().getValue();
            if (value.isString()) {
                values.add(value.stringValue().toLowerCase(java.util.Locale.ROOT));
            }
        }
        return values.stream();
    }

    private Optional<BigDecimal> extractPrice(JsonNode porotoEntry) {
        for (String key : PRICE_KEYS) {
            BigDecimal price = positiveNumber(porotoEntry.get(key));
            if (price != null) {
                return Optional.of(price);
            }
        }
        for (Iterator<Map.Entry<String, JsonNode>> it = porotoEntry.properties().iterator(); it.hasNext(); ) {
            BigDecimal price = positiveNumber(it.next().getValue());
            if (price != null) {
                return Optional.of(price);
            }
        }
        return Optional.empty();
    }

    private BigDecimal positiveNumber(JsonNode node) {
        if (node == null) {
            return null;
        }
        try {
            if (node.isNumber()) {
                BigDecimal value = node.decimalValue();
                return value.signum() > 0 ? value : null;
            }
            if (node.isString()) {
                String raw = node.stringValue().replace(".", "").replace(",", ".").trim();
                BigDecimal value = new BigDecimal(raw);
                return value.signum() > 0 ? value : null;
            }
        } catch (RuntimeException ignored) {
            return null;
        }
        return null;
    }
}
