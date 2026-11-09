package com.app.agtech.service;

import com.app.agtech.exception.ResourceNotFoundException;
import com.app.agtech.web.dto.FinancialImpactRequest;
import com.app.agtech.web.dto.FinancialImpactResponse;
import com.app.agtech.web.dto.MarketQuoteResponse;
import com.app.agtech.web.dto.MarketSnapshotResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

/**
 * Financial agent: turns a quality defect percentage into an estimated loss in
 * USD and ARS using real prices and the current BNA exchange rate.
 */
@Service
public class FinancialAgentService {

    private final MarketDataService marketDataService;
    private final BigDecimal penaltyFactor;

    public FinancialAgentService(
            MarketDataService marketDataService,
            @Value("${app.financial.penalty-factor:0.60}") BigDecimal penaltyFactor
    ) {
        this.marketDataService = marketDataService;
        this.penaltyFactor = penaltyFactor;
    }

    public FinancialImpactResponse calculateImpact(FinancialImpactRequest request) {
        // Reuses the cached market snapshot, so the FX rate and the grain price
        // are exactly the same values shown by GET /api/market-snapshot.
        MarketSnapshotResponse snapshot = marketDataService.getSnapshot();
        String venue = request.venue() == null || request.venue().isBlank()
                ? "global"
                : request.venue();

        MarketQuoteResponse quote = findQuote(snapshot, request.grain(), venue);
        if (quote == null) {
            throw new ResourceNotFoundException(
                    "No real market quote is available for " + request.grain() + " at " + venue
            );
        }

        BigDecimal defectRate = BigDecimal.valueOf(request.defectPercentage())
                .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
        BigDecimal defectiveTons = BigDecimal.valueOf(request.tons()).multiply(defectRate);
        BigDecimal lossUsd = defectiveTons
                .multiply(quote.priceUsd())
                .multiply(penaltyFactor)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal lossArs = lossUsd
                .multiply(snapshot.usdArs())
                .setScale(2, RoundingMode.HALF_UP);

        return new FinancialImpactResponse(
                request.grain(),
                quote.venue(),
                quote.priceUsd(),
                snapshot.usdArs(),
                BigDecimal.valueOf(request.defectPercentage()).setScale(2, RoundingMode.HALF_UP),
                penaltyFactor.setScale(2, RoundingMode.HALF_UP),
                lossUsd,
                lossArs,
                quote.source(),
                Instant.now()
        );
    }

    private MarketQuoteResponse findQuote(MarketSnapshotResponse snapshot, String grain, String venue) {
        return snapshot.quotes().stream()
                .filter(quote -> grain.equals(quote.grain()) && venue.equals(quote.venue()))
                .findFirst()
                .orElseGet(() -> snapshot.quotes().stream()
                        .filter(quote -> grain.equals(quote.grain()))
                        .findFirst()
                        .orElse(null));
    }
}
