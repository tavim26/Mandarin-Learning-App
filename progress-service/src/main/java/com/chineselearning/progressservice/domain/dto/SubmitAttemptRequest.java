package com.chineselearning.progressservice.domain.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class SubmitAttemptRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Exercise ID is required")
    private Long exerciseId;

    @NotNull(message = "Submitted answer is required")
    private Map<String, Object> submittedAnswer;

    public SubmitAttemptRequest() {
    }

    public SubmitAttemptRequest(Long studentId, Long exerciseId, Map<String, Object> submittedAnswer) {
        this.studentId = studentId;
        this.exerciseId = exerciseId;
        this.submittedAnswer = submittedAnswer;
    }


    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getExerciseId() {
        return exerciseId;
    }

    public void setExerciseId(Long exerciseId) {
        this.exerciseId = exerciseId;
    }

    public Map<String, Object> getSubmittedAnswer() {
        return submittedAnswer;
    }

    public void setSubmittedAnswer(Map<String, Object> submittedAnswer) {
        this.submittedAnswer = submittedAnswer;
    }
}