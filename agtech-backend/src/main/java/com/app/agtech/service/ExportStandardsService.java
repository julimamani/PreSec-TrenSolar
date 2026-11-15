package com.app.agtech.service;

import com.app.agtech.domain.entity.InferenceResult;
import com.app.agtech.domain.enums.MarketGrain;
import com.app.agtech.exception.ResourceNotFoundException;
import com.app.agtech.web.dto.ExportCriterionCheckResponse;
import com.app.agtech.web.dto.ExportCriterionResponse;
import com.app.agtech.web.dto.ExportEvaluationResponse;
import com.app.agtech.web.dto.ExportStandardResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Export quality standards for poroto, from the official
 * "Norma de calidad para la comercialización de POROTO NATURAL
 * (Phaseolus vulgaris L.)" — Norma XVI, Anexo B (Resolución 228/2021)
 * of the Cámara Arbitral de Cereales (Bolsa de Comercio de Rosario).
 *
 * <p>The chamber publishes the norm as a document only — there is no public
 * API for quality standards — so the base and receival tolerances are bundled
 * here with their source. The pizarra <em>price</em> is fetched live through
 * {@link com.app.agtech.integration.CacPizarraClient}.</p>
 *
 * <p>Each rubro is evaluated as: {@code OK} (at or under base),
 * {@code REBAJA} (above base but under the receival tolerance, a price
 * discount applies) or {@code RECHAZO} (above tolerance, or any presence for
 * the "libre" rubros that must be absent, like live insects).</p>
 */
@Service
public class ExportStandardsService {

    private static final String NORMA = "Norma XVI – Anexo B (Resolución 228/2021)";
    private static final String SCOPE = "Poroto natural – bases de comercialización y tolerancias de recibo";
    private static final String SOURCE =
            "Cámara Arbitral de Cereales – Bolsa de Comercio de Rosario "
                    + "(norma publicada como documento; no existe API pública de estándares)";

    private record Criterion(
            String key,
            String label,
            BigDecimal base,
            BigDecimal tolerance,
            BigDecimal bonusRate,
            BigDecimal rebateRate,
            boolean mustBeAbsent,
            String note,
            List<String> aliases
    ) {
    }

    private static final List<Criterion> POROTO_NATURAL = List.of(
            new Criterion("materias_extranas", "Materias extrañas",
                    new BigDecimal("2.0"), new BigDecimal("4.0"),
                    null, new BigDecimal("1.0"), false,
                    "La base incluye 1,0% de tierra; la tolerancia 1,5%.",
                    List.of("materia_extrana", "materias_extrana", "foreign_matter",
                            "foreign_material", "impurities", "impurezas", "materia_inerte")),
            new Criterion("defectos_danos_leves", "Defectos y daños leves",
                    new BigDecimal("10.0"), new BigDecimal("15.0"),
                    new BigDecimal("1.0"), new BigDecimal("1.0"), false,
                    "Bonificación/rebaja de 1% por cada % o fracción proporcional respecto de la base.",
                    List.of("danos_leves", "defectos_leves", "defectos_y_danos_leves",
                            "danos_y_defectos_leves", "minor_damage", "lightly_damaged",
                            "slightly_damaged")),
            new Criterion("defectos_danos_intensos", "Defectos y daños intensos",
                    new BigDecimal("5.0"), new BigDecimal("8.0"),
                    new BigDecimal("1.0"), new BigDecimal("1.0"), false,
                    "Bonificación/rebaja de 1% por cada % o fracción proporcional respecto de la base.",
                    List.of("danos_intensos", "defectos_intensos", "defectos_y_danos_intensos",
                            "danos_y_defectos_intensos", "severe_damage", "heavily_damaged")),
            new Criterion("granos_manchados", "Granos manchados",
                    new BigDecimal("5.0"), new BigDecimal("8.0"),
                    new BigDecimal("1.0"), new BigDecimal("1.0"), false,
                    "Bonificación/rebaja de 1% por cada % o fracción proporcional respecto de la base.",
                    List.of("manchados", "stained", "stained_beans", "spotted",
                            "spotted_beans", "discolored", "decolorados")),
            new Criterion("granos_quebrados", "Granos quebrados y/o partidos",
                    new BigDecimal("4.0"), new BigDecimal("7.0"),
                    new BigDecimal("1.0"), new BigDecimal("1.0"), false,
                    "Bonificación/rebaja de 1% por cada % o fracción proporcional respecto de la base.",
                    List.of("quebrados", "partidos", "granos_partidos",
                            "granos_quebrados_y_o_partidos", "broken", "broken_beans",
                            "split", "split_beans", "splits")),
            new Criterion("porotos_contrastantes", "Porotos contrastantes",
                    new BigDecimal("3.0"), new BigDecimal("5.0"),
                    new BigDecimal("0.5"), new BigDecimal("0.5"), false,
                    "Bonificación/rebaja de 0,5% por cada % o fracción proporcional respecto de la base.",
                    List.of("contrastantes", "contrasting", "contrasting_beans",
                            "other_colors", "otros_colores", "other_color_beans")),
            new Criterion("porotos_no_contrastantes", "Porotos no contrastantes",
                    new BigDecimal("8.0"), new BigDecimal("20.0"),
                    new BigDecimal("0.5"), new BigDecimal("0.5"), false,
                    "Bonificación/rebaja de 0,5% por cada % o fracción proporcional respecto de la base.",
                    List.of("no_contrastantes", "non_contrasting", "non_contrasting_beans")),
            new Criterion("humedad", "Humedad",
                    null, new BigDecimal("15.0"),
                    null, null, false,
                    "Sin base; tolerancia de recibo 15%. La merma se calcula como (Hi−Hf)/(100−Hf)×100.",
                    List.of("humidity", "moisture", "water_content")),
            new Criterion("granos_picados", "Granos picados",
                    null, null,
                    null, new BigDecimal("1.5"), false,
                    "Base y tolerancia libres; rebaja de 1,5% por cada % o fracción proporcional.",
                    List.of("picados", "weeviled", "insect_damage", "insect_damaged", "gorgojo")),
            new Criterion("granos_revolcados_tierra", "Granos revolcados en tierra",
                    null, null,
                    null, null, false,
                    "Libre; arbitraje sobre el precio de 0,5% a 2% según intensidad.",
                    List.of("revolcados", "revolcados_en_tierra",
                            "granos_revolcados_en_tierra", "soiled", "earthed")),
            new Criterion("insectos_aracnidos_vivos", "Insectos y/o arácnidos vivos",
                    null, null,
                    null, null, true,
                    "Libre: la mercadería debe estar libre de insectos y/o arácnidos vivos.",
                    List.of("insectos_vivos", "insectos", "insectos_y_o_aracnidos_vivos",
                            "live_insects", "insects", "pests", "aracnidos")),
            new Criterion("olores_objetables", "Olores comercialmente objetables",
                    null, null,
                    null, null, false,
                    "Libre; descuento sobre el precio de 0,5% a 2% según intensidad.",
                    List.of("olores", "objetable_odors", "odors", "off_odors")),
            new Criterion("sustancias_condicion_natural", "Sustancias que alteran su condición natural",
                    null, null,
                    null, null, true,
                    "Libre: cualquier presencia deja la mercadería fuera de norma.",
                    List.of("sustancias", "sustancias_extranas", "foreign_substances",
                            "condition_altering",
                            "sustancias_que_alteran_su_condicion_natural"))
    );

    private static final Map<String, Criterion> DEFECT_KEY_INDEX = buildIndex();

    private static final List<String> FORBIDDEN_CONDITIONS = List.of(
            "Insectos y/o arácnidos vivos (la mercadería debe estar libre)",
            "Sustancias que alteren la condición natural del grano",
            "Humedad por encima del 15% (fuera de tolerancia de recibo)"
    );

    private static Map<String, Criterion> buildIndex() {
        Map<String, Criterion> index = new HashMap<>();
        for (Criterion criterion : POROTO_NATURAL) {
            index.put(normalize(criterion.key()), criterion);
            for (String alias : criterion.aliases()) {
                index.put(normalize(alias), criterion);
            }
        }
        return index;
    }

    public List<ExportStandardResponse> standards() {
        return List.of(porotoStandard());
    }

    public ExportStandardResponse standardFor(String grainId) {
        MarketGrain grain = MarketGrain.find(grainId)
                .filter(g -> g == MarketGrain.POROTO)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No export standard is available for grain " + grainId
                                + "; only poroto is supported in this MVP"
                ));
        return porotoStandard();
    }

    /**
     * Evaluates a defect map (as returned by the vision model) against the
     * poroto natural export standard. Defect keys are normalized (accents,
     * case and separators are ignored) and matched against the norm rubros
     * and their common aliases.
     */
    public ExportEvaluationResponse evaluate(
            String grain,
            Double exportPercentage,
            Double discardPercentage,
            Map<String, Object> defectDetails
    ) {
        Map<String, BigDecimal> measured = new HashMap<>();
        List<String> unmapped = new ArrayList<>();

        for (Map.Entry<String, Object> entry : defectDetailsOrEmpty(defectDetails).entrySet()) {
            Criterion criterion = DEFECT_KEY_INDEX.get(normalize(entry.getKey()));
            BigDecimal value = toPercentage(entry.getValue());
            if (criterion == null || value == null) {
                unmapped.add(entry.getKey() + "=" + entry.getValue());
                continue;
            }
            measured.merge(criterion.key(), value, BigDecimal::add);
        }

        List<ExportCriterionCheckResponse> checks = new ArrayList<>();
        List<String> violations = new ArrayList<>();

        for (Criterion criterion : POROTO_NATURAL) {
            BigDecimal value = measured.get(criterion.key());
            String status = statusOf(criterion, value);
            checks.add(new ExportCriterionCheckResponse(
                    criterion.key(),
                    criterion.label(),
                    criterion.base(),
                    criterion.tolerance(),
                    value,
                    status,
                    criterion.note()
            ));
            if ("RECHAZO".equals(status)) {
                violations.add(criterion.label() + ": " + value.stripTrailingZeros().toPlainString()
                        + "% supera la tolerancia" + describeLimit(criterion));
            }
        }

        return new ExportEvaluationResponse(
                MarketGrain.POROTO.id(),
                violations.isEmpty(),
                exportPercentage,
                discardPercentage,
                List.copyOf(checks),
                List.copyOf(violations),
                List.copyOf(unmapped),
                NORMA,
                Instant.now()
        );
    }

    public ExportEvaluationResponse evaluate(InferenceResult result) {
        return evaluate(
                MarketGrain.POROTO.id(),
                result.getExportPercentage(),
                result.getDiscardPercentage(),
                result.getDefectDetails()
        );
    }

    private String statusOf(Criterion criterion, BigDecimal measured) {
        if (measured == null) {
            return "SIN_MEDICION";
        }
        if (measured.signum() <= 0) {
            return "OK";
        }
        if (criterion.mustBeAbsent()) {
            return "RECHAZO";
        }
        if (criterion.tolerance() != null && measured.compareTo(criterion.tolerance()) > 0) {
            return "RECHAZO";
        }
        if (criterion.base() != null && measured.compareTo(criterion.base()) > 0) {
            return "REBAJA";
        }
        if (criterion.base() == null) {
            // "Libre" rubros: any presence triggers a discount/arbitration, not rejection
            return "REBAJA";
        }
        return "OK";
    }

    private String describeLimit(Criterion criterion) {
        if (criterion.mustBeAbsent()) {
            return "; el rubro exige ausencia total";
        }
        if (criterion.tolerance() != null) {
            return " de " + criterion.tolerance().stripTrailingZeros().toPlainString() + "%";
        }
        return "";
    }

    private ExportStandardResponse porotoStandard() {
        List<ExportCriterionResponse> criteria = POROTO_NATURAL.stream()
                .map(c -> new ExportCriterionResponse(
                        c.key(), c.label(), c.base(), c.tolerance(),
                        c.bonusRate(), c.rebateRate(), c.note()
                ))
                .toList();

        return new ExportStandardResponse(
                MarketGrain.POROTO.id(),
                "Poroto natural (Phaseolus vulgaris L.)",
                NORMA,
                SCOPE,
                SOURCE,
                criteria,
                FORBIDDEN_CONDITIONS
        );
    }

    private Map<String, Object> defectDetailsOrEmpty(Map<String, Object> defectDetails) {
        return defectDetails == null ? Map.of() : defectDetails;
    }

    private BigDecimal toPercentage(Object value) {
        try {
            if (value instanceof Number number) {
                return BigDecimal.valueOf(number.doubleValue());
            }
            if (value instanceof String string && !string.isBlank()) {
                return new BigDecimal(string.trim().replace(",", "."));
            }
        } catch (RuntimeException ignored) {
            return null;
        }
        return null;
    }

    private static String normalize(String key) {
        if (key == null) {
            return "";
        }
        String normalized = Normalizer.normalize(key, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        return normalized;
    }
}
