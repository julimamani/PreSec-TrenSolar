package com.app.backend.integration;

import com.app.backend.config.MarketProperties;
import com.app.backend.exception.MarketDataException;
import com.app.backend.integration.dto.DolarApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.net.URI;

/**
 * Fallback exchange-rate adapter. granos.ar already returns the BNA rate, but
 * dolarapi.com lets the platform keep working if that endpoint is unavailable.
 */
@Component
public class DolarApiClient {

    private final RestClient restClient;
    private final String baseUrl;

    public DolarApiClient(
            RestClient.Builder builder,
            MarketProperties properties,
            @Value("${api.dolar.url:https://dolarapi.com/v1/dolares}") String baseUrl
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.connectTimeout());
        requestFactory.setReadTimeout(properties.readTimeout());

        this.restClient = builder.requestFactory(requestFactory).build();
        this.baseUrl = baseUrl;
    }

    public BigDecimal fetchMayoristaVenta() {
        try {
            DolarApiResponse response = restClient.get()
                    .uri(uri("/mayorista"))
                    .retrieve()
                    .body(DolarApiResponse.class);

            if (response == null || response.venta() == null || response.venta().signum() <= 0) {
                throw new MarketDataException("dolarapi.com returned an invalid exchange rate");
            }
            return response.venta();
        } catch (RestClientResponseException exception) {
            throw new MarketDataException(
                    "dolarapi.com returned HTTP " + exception.getStatusCode().value(),
                    exception
            );
        } catch (ResourceAccessException exception) {
            throw new MarketDataException("dolarapi.com is unavailable", exception);
        } catch (RestClientException exception) {
            throw new MarketDataException("The exchange-rate request could not be completed", exception);
        }
    }

    private URI uri(String path) {
        String base = baseUrl;
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return URI.create(base + path);
    }
}
