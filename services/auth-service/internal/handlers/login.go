package handlers

import (
	"encoding/json"
	"net/http"

	"wkt3.com/auth-service/internal/storage"
	"wkt3.com/auth-service/internal/utils"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	user, err := storage.Store.GetByField("users", "email", req.Email)
	if err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	if !user.Verified {
		http.Error(w, "email not verified", http.StatusForbidden)
		return
	}

	// issue session token
	token, _ := utils.RandomToken(32)
	storage.Store.Insert("sessions", token, map[string]string{"email": user.Email})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"token":   token,
	})
}
