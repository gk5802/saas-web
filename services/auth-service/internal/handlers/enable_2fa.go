package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"wkt3.com/auth-service/internal/storage"
	"wkt3.com/auth-service/internal/utils"
)

type enable2FAReq struct{
	UserID string `json:"userId"`
	Secret string `json:"secret"`
	OTP    string `json:"otp"`
}

func Enable2FA(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost { http.Error(w, "method", http.StatusMethodNotAllowed); return }
	var req enable2FAReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { http.Error(w, "bad json", http.StatusBadRequest); return }

	u, err := storage.FindUserByID(req.UserID)
	if err != nil { http.Error(w, "user not found", http.StatusNotFound); return }

	if !utils.VerifyTOTP(req.Secret, req.OTP, 30, 1) {
		http.Error(w, "invalid otp", http.StatusUnauthorized); return
	}

	// encrypt secret at rest (dev: base64 के पीछे simple; future: proper KMS)
	enc := req.Secret // TODO: replace with real encryption util if needed
	u.TwoFAEnabled = true
	u.TwoFASecretEnc = enc
	u.UpdatedAt = time.Now()
	_ = storage.UpdateUser(*u)

	_ = json.NewEncoder(w).Encode(map[string]any{"success": true})
	storage.AuditLog(storage.Audit{TS: time.Now(), UserID: u.ID, Act:"enable-2fa"})
}
