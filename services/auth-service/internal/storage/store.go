package storage

import (
	"errors"
	"sync"
)

type MemoryStore struct {
	mu   sync.Mutex
	data map[string][]map[string]any
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		data: make(map[string][]map[string]any),
	}
}


func (s *MemoryStore) GetUserByEmail(email string) (map[string]any, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	users := s.data["users"]
	for _, u := range users {
		if u["email"] == email {
			return u, nil
		}
	}
	return nil, errors.New("user not found")
}
// Insert a new document
func (s *MemoryStore) Insert(collection string, doc map[string]any) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[collection] = append(s.data[collection], doc)
}

// Get documents by field
func (s *MemoryStore) GetByField(collection, field string, value any) []map[string]any {
	s.mu.Lock()
	defer s.mu.Unlock()
	results := []map[string]any{}
	for _, doc := range s.data[collection] {
		if doc[field] == value {
			results = append(results, doc)
		}
	}
	return results
}

// Delete documents by field
func (s *MemoryStore) DeleteByField(collection, field string, value any) {
	s.mu.Lock()
	defer s.mu.Unlock()
	newDocs := []map[string]any{}
	for _, doc := range s.data[collection] {
		if doc[field] != value {
			newDocs = append(newDocs, doc)
		}
	}
	s.data[collection] = newDocs
}