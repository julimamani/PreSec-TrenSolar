package com.app.agtech.integration;

import com.app.agtech.config.RemarketsProperties;
import com.app.agtech.domain.enums.MarketGrain;
import com.app.agtech.integration.dto.MatbaRofexQuote;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class MatbaRofexClientTest {

    private static final String MARKET_DATA_RESPONSE = """
            {"status":"OK","marketData":{"LA":{"price":470.50,"size":4,"date":1762600000000}},"depth":1,"aggregated":true}
            """;

    @Test
    void authenticatesOnceAndReadsTheLastPrice() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        RemarketsProperties properties = new RemarketsProperties(
                "https://api.remarkets.primary.com.ar",
                "user",
                "password",
                "account",
                Duration.ofHours(24),
                Map.of("soja", "SOJ.ROS/FEB27")
        );
        MatbaRofexClient client = new MatbaRofexClient(builder.build(), properties);

        server.expect(requestTo("https://api.remarkets.primary.com.ar/auth/getToken"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Username", "user"))
                .andExpect(header("X-Password", "password"))
                .andRespond(withSuccess().header("X-Auth-Token", "token-123"));

        server.expect(requestTo(org.hamcrest.Matchers.containsString("/rest/marketdata/get")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("X-Auth-Token", "token-123"))
                .andRespond(withSuccess(MARKET_DATA_RESPONSE, MediaType.APPLICATION_JSON));

        server.expect(requestTo(org.hamcrest.Matchers.containsString("/rest/marketdata/get")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("X-Auth-Token", "token-123"))
                .andRespond(withSuccess(MARKET_DATA_RESPONSE, MediaType.APPLICATION_JSON));

        Optional<MatbaRofexQuote> first = client.fetchLastPrice(MarketGrain.SOJA);
        Optional<MatbaRofexQuote> second = client.fetchLastPrice(MarketGrain.SOJA);

        assertTrue(first.isPresent());
        assertEquals("SOJ.ROS/FEB27", first.get().symbol());
        assertEquals(0, new BigDecimal("470.50").compareTo(first.get().price()));
        assertTrue(second.isPresent());
        server.verify();
    }

    @Test
    void usesSettlementPriceWhenThereIsNoLastPrice() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        RemarketsProperties properties = new RemarketsProperties(
                "https://api.remarkets.primary.com.ar",
                "user",
                "password",
                "account",
                Duration.ofHours(24),
                Map.of("soja", "SOJ.ROS/ENE27")
        );
        MatbaRofexClient client = new MatbaRofexClient(builder.build(), properties);

        server.expect(requestTo("https://api.remarkets.primary.com.ar/auth/getToken"))
                .andRespond(withSuccess().header("X-Auth-Token", "token-123"));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("/rest/marketdata/get")))
                .andRespond(withSuccess("""
                        {"status":"OK","marketData":{"LA":null,"SE":{"price":356.5,"size":null,"date":1793923200000}},"depth":1,"aggregated":true}
                        """, MediaType.APPLICATION_JSON));

        Optional<MatbaRofexQuote> quote = client.fetchLastPrice(MarketGrain.SOJA);

        assertTrue(quote.isPresent());
        assertEquals(0, new BigDecimal("356.50").compareTo(quote.get().price()));
        server.verify();
    }
}
