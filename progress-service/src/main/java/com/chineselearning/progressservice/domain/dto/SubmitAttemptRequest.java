package com.chineselearning.progressservice.domain.dto;

import java.util.Map;

public class SubmitAttemptRequest
{

    private Long exerciseId;
    private Map<String, Object> submittedAnswer;

    public SubmitAttemptRequest() {}

    public SubmitAttemptRequest(Long exerciseId, Map<String, Object> submittedAnswer)
    {
        this.exerciseId = exerciseId;
        this.submittedAnswer = submittedAnswer;
    }

    public Long getExerciseId() { return exerciseId; }
    public void setExerciseId(Long exerciseId) { this.exerciseId = exerciseId; }

    public Map<String, Object> getSubmittedAnswer() { return submittedAnswer; }
    public void setSubmittedAnswer(Map<String, Object> submittedAnswer) { this.submittedAnswer = submittedAnswer; }
}