package handlers

import (
	"encoding/json"
	"net/http"

	"wkt3.com/auth-service/internal/models"
	"wkt3.com/auth-service/internal/storage"
	"wkt3.com/auth-service/internal/utils"
)

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func SignupHandler(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// hash password
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	// generate verification token
	token, err := utils.RandomToken(32)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	user := &models.User{
		ID:               req.Email, // simplify ID = email for now
		Email:            req.Email,
		PasswordHash:     hash,
		Verified:         false,
		VerificationToken: token,
	}

	if err := storage.Store.Insert("users", user.Email, user); err != nil {
		http.Error(w, "user already exists", http.StatusConflict)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "user created, please verify email",
		"token":   token,
	})
}
