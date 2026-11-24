package com.talentprep.interview.agent;

import com.talentprep.interview.entity.enums.RoundType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class InterviewOrchestrator {

    private final Map<RoundType, InterviewStrategy> strategies = new EnumMap<>(RoundType.class);

    public InterviewOrchestrator(List<InterviewStrategy> strategyList) {
        for (InterviewStrategy strategy : strategyList) {
            strategies.put(strategy.getRoundType(), strategy);
        }
    }

    public InterviewStrategy getStrategy(RoundType roundType) {
        InterviewStrategy strategy = strategies.get(roundType);
        if (strategy == null) {
            throw new IllegalArgumentException("No interview strategy registered for round type: " + roundType);
        }
        return strategy;
    }
}

