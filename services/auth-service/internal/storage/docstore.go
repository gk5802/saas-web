package storage

import (
	"bufio"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"wkt3.com/auth-service/internal/models"
)

// thin type aliases to avoid circular imports in handlers using storage.* helpers
type Session = models.Session
type Temp2FA = models.Temp2FA
type User = models.User

// 🗃️ Simple JSONL doc store (append-only) + in-memory indexes
// हिन्दी टिप्पणी: dev/POC के लिए fast & simple storage. हर write append होता है,
// और memory indexes के ज़रिए हम जल्दी lookup कर लेते हैं।

var baseDir string

var once sync.Once

// collections
var (
	usersMu      sync.RWMutex
	usersByID    = map[string]models.User{}
	userIDByMail = map[string]string{} // lower(email) -> id

	sessionsMu   sync.RWMutex
	sessionsByTk = map[string]models.Session{} // token -> session

	temp2faMu   sync.RWMutex
	temp2faByID = map[string]models.Temp2FA{}

	auditMu sync.Mutex
)

func InitDocStore(dir string) error {
	var err error
	once.Do(func() {
		baseDir = dir
		err = loadAll()
	})
	return err
}

func path(name string) string { return filepath.Join(baseDir, name+".jsonl") }

func loadAll() error {
	// load users
	_ = loadJSONL(path("users"), func(line []byte) {
		var u models.User
		if json.Unmarshal(line, &u) == nil && u.ID != "" {
			usersByID[u.ID] = u
			userIDByMail[strings.ToLower(u.Email)] = u.ID
		}
	})
	// load sessions
	_ = loadJSONL(path("sessions"), func(line []byte) {
		var s models.Session
		if json.Unmarshal(line, &s) == nil && s.Token != "" {
			sessionsByTk[s.Token] = s
		}
	})
	// load temp2fa
	_ = loadJSONL(path("temp2fa"), func(line []byte) {
		var t models.Temp2FA
		if json.Unmarshal(line, &t) == nil && t.ID != "" {
			temp2faByID[t.ID] = t
		}
	})
	return nil
}

func loadJSONL(p string, each func([]byte)) error {
	f, err := os.Open(p)
	if err != nil {
		return nil // first run ok
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		each(sc.Bytes())
	}
	return nil
}

func appendJSONL(p string, v any) error {
	f, err := os.OpenFile(p, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	return enc.Encode(v)
}

// ========== USERS ==========

func CreateUser(u models.User) error {
	usersMu.Lock()
	defer usersMu.Unlock()
	mail := strings.ToLower(strings.TrimSpace(u.Email))
	if mail == "" {
		return errors.New("empty email")
	}
	if _, ok := userIDByMail[mail]; ok {
		return errors.New("email exists")
	}
	if u.ID == "" {
		return errors.New("missing id")
	}
	usersByID[u.ID] = u
	userIDByMail[mail] = u.ID
	return appendJSONL(path("users"), u)
}

func UpdateUser(u models.User) error {
	usersMu.Lock()
	defer usersMu.Unlock()
	if _, ok := usersByID[u.ID]; !ok {
		return errors.New("user not found")
	}
	usersByID[u.ID] = u
	return appendJSONL(path("users"), u)
}

func FindUserByEmail(email string) (*models.User, error) {
	usersMu.RLock()
	defer usersMu.RUnlock()
	id, ok := userIDByMail[strings.ToLower(strings.TrimSpace(email))]
	if !ok {
		return nil, errors.New("not found")
	}
	u := usersByID[id]
	return &u, nil
}

func FindUserByID(id string) (*models.User, error) {
	usersMu.RLock()
	defer usersMu.RUnlock()
	u, ok := usersByID[id]
	if !ok {
		return nil, errors.New("not found")
	}
	return &u, nil
}

// helper: find by verify token (iterate in-memory map)
func FindUserByVerifyToken(tok string) *models.User {
	usersMu.RLock()
	defer usersMu.RUnlock()
	for _, u := range usersByID {
		if u.VerifyToken == tok {
			uu := u
			return &uu
		}
	}
	return nil
}


// ========== SESSIONS ==========

func SaveSession(s models.Session) error {
	sessionsMu.Lock()
	defer sessionsMu.Unlock()
	sessionsByTk[s.Token] = s
	return appendJSONL(path("sessions"), s)
}

func GetSession(token string) (*models.Session, error) {
	sessionsMu.RLock()
	defer sessionsMu.RUnlock()
	s, ok := sessionsByTk[token]
	if !ok {
		return nil, errors.New("not found")
	}
	return &s, nil
}

func DeleteSession(token string) error {
	sessionsMu.Lock()
	defer sessionsMu.Unlock()
	// append tombstone (ExpiresAt in past) — simple revoke marker
	if s, ok := sessionsByTk[token]; ok {
		s.ExpiresAt = time.Now().Add(-1 * time.Hour)
		sessionsByTk[token] = s
		return appendJSONL(path("sessions"), s)
	}
	return nil
}

// ========== TEMP 2FA ==========

func SaveTemp2FA(t models.Temp2FA) error {
	temp2faMu.Lock()
	defer temp2faMu.Unlock()
	temp2faByID[t.ID] = t
	return appendJSONL(path("temp2fa"), t)
}

func GetTemp2FA(id string) (*models.Temp2FA, error) {
	temp2faMu.RLock()
	defer temp2faMu.RUnlock()
	t, ok := temp2faByID[id]
	if !ok {
		return nil, errors.New("not found")
	}
	return &t, nil
}

func DeleteTemp2FA(id string) error {
	temp2faMu.Lock()
	defer temp2faMu.Unlock()
	delete(temp2faByID, id)
	// optional: append tombstone record
	return nil
}

// ========== AUDIT ==========

type Audit struct {
	TS     time.Time `json:"ts"`
	UserID string    `json:"userId,omitempty"`
	Act    string    `json:"act"`
	Meta   any       `json:"meta,omitempty"`
}

func AuditLog(a Audit) {
	auditMu.Lock()
	defer auditMu.Unlock()
	_ = appendJSONL(path("audit"), a)
}
