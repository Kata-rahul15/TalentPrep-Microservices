package com.talentprep.interview.coding.service;

import com.talentprep.interview.coding.entity.CodingProblem;
import com.talentprep.interview.coding.repository.CodingProblemRepository;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodingProblemBankService {

    private final CodingProblemRepository problemRepository;

    public Optional<CodingProblem> findBySlug(String slug) {
        return problemRepository.findBySlug(slug);
    }

    public Optional<CodingProblem> findById(UUID id) {
        return problemRepository.findById(id);
    }

    public List<CodingProblem> getAllProblems() {
        return problemRepository.findAll();
    }

    public Optional<CodingProblem> findProblemForDifficulty(DifficultyLevel difficulty, Set<String> excludeSlugs) {
        List<CodingProblem> matches = problemRepository.findByDifficulty(difficulty);
        if (matches.isEmpty()) {
            // fallback to any difficulty if none match exact
            matches = problemRepository.findAll();
        }

        if (matches.isEmpty()) {
            return Optional.empty();
        }

        // Filter out previously asked problems (match by slug, title, or substring in questionText)
        List<CodingProblem> available = matches.stream()
                .filter(p -> {
                    if (excludeSlugs == null || excludeSlugs.isEmpty()) return true;
                    if (excludeSlugs.contains(p.getSlug()) || excludeSlugs.contains(p.getTitle())) {
                        return false;
                    }
                    for (String exc : excludeSlugs) {
                        if (exc == null || exc.isBlank()) continue;
                        if (exc.equals(p.getDescription().trim())
                                || exc.contains(p.getTitle())
                                || p.getDescription().contains(exc)) {
                            return false;
                        }
                    }
                    return true;
                })
                .toList();

        if (available.isEmpty()) {
            // If all matched difficulty problems were used, try problems from other difficulties not yet used
            List<CodingProblem> anyUnused = problemRepository.findAll().stream()
                    .filter(p -> {
                        if (excludeSlugs == null || excludeSlugs.isEmpty()) return true;
                        if (excludeSlugs.contains(p.getSlug()) || excludeSlugs.contains(p.getTitle())) return false;
                        for (String exc : excludeSlugs) {
                            if (exc == null || exc.isBlank()) continue;
                            if (exc.equals(p.getDescription().trim()) || exc.contains(p.getTitle()) || p.getDescription().contains(exc)) {
                                return false;
                            }
                        }
                        return true;
                    })
                    .toList();
            if (!anyUnused.isEmpty()) {
                return Optional.of(anyUnused.get(new Random().nextInt(anyUnused.size())));
            }
            return Optional.of(matches.get(new Random().nextInt(matches.size())));
        }

        return Optional.of(available.get(new Random().nextInt(available.size())));
    }
}
