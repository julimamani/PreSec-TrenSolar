package com.app.agtech.service;

import com.app.agtech.exception.ResourceNotFoundException;
import com.app.agtech.web.dto.ExportCriterionCheckResponse;
import com.app.agtech.web.dto.ExportEvaluationResponse;
import com.app.agtech.web.dto.ExportStandardResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExportStandardsServiceTest {

    private final ExportStandardsService service = new ExportStandardsService();

    @Test
    void exposesTheNormaXviPorotoStandard() {
        ExportStandardResponse standard = service.standardFor("poroto");

        assertEquals("poroto", standard.grain());
        assertTrue(standard.norma().contains("Norma XVI"));
        assertTrue(standard.source().contains("Cámara Arbitral"));
        assertEquals(13, standard.criteria().size());
        assertFalse(standard.forbiddenConditions().isEmpty());

        var materiasExtranas = standard.criteria().stream()
                .filter(c -> c.key().equals("materias_extranas"))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("2.0").compareTo(materiasExtranas.basePercentage()));
        assertEquals(0, new BigDecimal("4.0").compareTo(materiasExtranas.tolerancePercentage()));
    }

    @Test
    void rejectsStandardsForOtherGrainsInTheMvp() {
        assertThrows(ResourceNotFoundException.class, () -> service.standardFor("soja"));
    }

    @Test
    void marksValuesWithinBaseAsOkAndExportable() {
        ExportEvaluationResponse evaluation = service.evaluate(
                "poroto", 95.0, 5.0,
                Map.of("granos_manchados", 4.0, "materias_extranas", 1.5)
        );

        assertTrue(evaluation.exportable());
        assertTrue(evaluation.violations().isEmpty());
        assertEquals("OK", check(evaluation, "granos_manchados").status());
    }

    @Test
    void marksValuesBetweenBaseAndToleranceAsRebaja() {
        ExportEvaluationResponse evaluation = service.evaluate(
                "poroto", 90.0, 10.0,
                Map.of("broken", 6.0)
        );

        // "broken" maps to granos_quebrados (base 4%, tolerance 7%)
        assertTrue(evaluation.exportable());
        assertEquals("REBAJA", check(evaluation, "granos_quebrados").status());
    }

    @Test
    void rejectsWhenToleranceIsExceeded() {
        ExportEvaluationResponse evaluation = service.evaluate(
                "poroto", 80.0, 20.0,
                Map.of("granos_manchados", 9.0)
        );

        assertFalse(evaluation.exportable());
        assertEquals("RECHAZO", check(evaluation, "granos_manchados").status());
        assertTrue(evaluation.violations().stream().anyMatch(v -> v.contains("Granos manchados")));
    }

    @Test
    void rejectsAnyPresenceOfRubrosThatMustBeAbsent() {
        ExportEvaluationResponse evaluation = service.evaluate(
                "poroto", 92.0, 8.0,
                Map.of("live_insects", 0.5)
        );

        assertFalse(evaluation.exportable());
        assertEquals("RECHAZO", check(evaluation, "insectos_aracnidos_vivos").status());
    }

    @Test
    void normalizesLiteralRubricNamesFromTheNorm() {
        ExportEvaluationResponse evaluation = service.evaluate(
                "poroto", 88.0, 12.0,
                Map.of("Defectos y Daños Leves", 12.0, "Granos quebrados y/o partidos", 8.0)
        );

        assertEquals(0, new BigDecimal("12.0").compareTo(
                check(evaluation, "defectos_danos_leves").measuredPercentage()));
        assertEquals("RECHAZO", check(evaluation, "granos_quebrados").status());
        assertFalse(evaluation.exportable());
    }

    @Test
    void reportsUnmappedDefectsInsteadOfFailing() {
        ExportEvaluationResponse evaluation = service.evaluate(
                "poroto", 92.0, 8.0,
                Map.of("holograma_raro", 3)
        );

        assertTrue(evaluation.exportable());
        assertTrue(evaluation.unmappedDefects().stream().anyMatch(d -> d.contains("holograma_raro")));
    }

    private ExportCriterionCheckResponse check(ExportEvaluationResponse evaluation, String key) {
        return evaluation.checks().stream()
                .filter(c -> c.key().equals(key))
                .findFirst()
                .orElseThrow();
    }
}
