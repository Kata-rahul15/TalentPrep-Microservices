package com.talentprep.interview.coding.repository;

import com.talentprep.interview.coding.entity.CodingProblem;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CodingProblemRepository extends JpaRepository<CodingProblem, UUID> {
    Optional<CodingProblem> findBySlug(String slug);
    List<CodingProblem> findByDifficulty(DifficultyLevel difficulty);
}
