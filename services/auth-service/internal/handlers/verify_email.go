package handlers

import (
	"encoding/json"
	"net/http"

	"wkt3.com/auth-service/internal/storage"
)

type VerifyRequest struct {
	Email string `json:"email"`
	Token string `json:"token"`
}

func VerifyEmailHandler(w http.ResponseWriter, r *http.Request) {
	var req VerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	user, err := storage.Store.GetByField("users", "email", req.Email)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	if user.VerificationToken != req.Token {
		http.Error(w, "invalid token", http.StatusForbidden)
		return
	}

	user.Verified = true
	user.VerificationToken = ""
	storage.Store.Update("users", user.Email, user)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "email verified successfully",
	})
}
