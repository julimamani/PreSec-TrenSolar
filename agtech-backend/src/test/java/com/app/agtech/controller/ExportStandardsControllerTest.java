package com.app.agtech.web;

import com.app.agtech.service.ExportStandardsService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ExportStandardsControllerTest {

    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new ExportStandardsController(new ExportStandardsService()))
            .build();

    @Test
    void exposesThePorotoExportStandard() throws Exception {
        mockMvc.perform(get("/api/export-standards"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].grain").value("poroto"))
                .andExpect(jsonPath("$[0].criteria").isArray())
                .andExpect(jsonPath("$[0].forbiddenConditions").isArray());

        mockMvc.perform(get("/api/export-standards/poroto"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.norma").value("Norma XVI – Anexo B (Resolución 228/2021)"));
    }

    @Test
    void evaluatesDefectDetailsAgainstTheStandard() throws Exception {
        mockMvc.perform(post("/api/export-standards/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "grain": "poroto",
                                  "exportPercentage": 90.0,
                                  "discardPercentage": 10.0,
                                  "defectDetails": {
                                    "granos_manchados": 9.0,
                                    "unknown_key": 1
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exportable").value(false))
                .andExpect(jsonPath("$.violations[0]").exists())
                .andExpect(jsonPath("$.unmappedDefects[0]").exists());
    }
}
