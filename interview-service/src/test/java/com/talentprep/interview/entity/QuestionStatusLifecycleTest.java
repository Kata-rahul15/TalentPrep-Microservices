package com.talentprep.interview.entity;

import com.talentprep.interview.entity.enums.QuestionStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class QuestionStatusLifecycleTest {
    @Test
    void readyIsAValidPersistableQuestionLifecycleState() {
        assertTrue(java.util.Arrays.asList(QuestionStatus.values()).contains(QuestionStatus.READY));
    }
}
