package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"wkt3.com/auth-service/internal/storage"
	"wkt3.com/auth-service/internal/utils"
)

type verify2faReq struct{
	TempID string `json:"tempId"`
	OTP    string `json:"otp"`
}

func Verify2FA(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost { http.Error(w, "method", http.StatusMethodNotAllowed); return }
	var req verify2faReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { http.Error(w, "bad json", http.StatusBadRequest); return }

	temp, err := storage.GetTemp2FA(req.TempID)
	if err != nil || time.Now().After(temp.ExpiresAt) { http.Error(w, "temp expired", http.StatusUnauthorized); return }

	u, err := storage.FindUserByID(temp.UserID)
	if err != nil { http.Error(w, "user not found", http.StatusNotFound); return }
	if !u.TwoFAEnabled || u.TwoFASecretEnc == "" { http.Error(w, "2fa not enabled", http.StatusBadRequest); return }

	if !utils.VerifyTOTP(u.TwoFASecretEnc, req.OTP, 30, 1) {
		http.Error(w, "invalid otp", http.StatusUnauthorized); return
	}

	// issue session
	token, _ := utils.RandomToken(32)
	sess := storage.Session{Token: token, UserID: u.ID, Role: u.Role, CreatedAt: time.Now(), ExpiresAt: time.Now().Add(24 * time.Hour)}
	_ = storage.SaveSession(sess)
	_ = storage.DeleteTemp2FA(req.TempID)

	_ = json.NewEncoder(w).Encode(map[string]any{"success": true, "sessionToken": token, "expires": sess.ExpiresAt})
	storage.AuditLog(storage.Audit{TS: time.Now(), UserID: u.ID, Act:"verify-2fa"})
}
