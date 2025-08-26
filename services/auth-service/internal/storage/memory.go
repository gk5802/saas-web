package storage

import (
	"errors"
	"sync"
)

type MemoryStore struct {
	mu    sync.RWMutex
	data  map[string]map[string]interface{}
}

var Store = NewMemoryStore() // ✅ Global Store instance

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		data: make(map[string]map[string]interface{}),
	}
}

func (s *MemoryStore) Insert(collection string, key string, value interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.data[collection]; !ok {
		s.data[collection] = make(map[string]interface{})
	}

	if _, exists := s.data[collection][key]; exists {
		return errors.New("already exists")
	}

	s.data[collection][key] = value
	return nil
}

func (s *MemoryStore) GetByField(collection string, field string, value string) (*UserWrapper, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if _, ok := s.data[collection]; !ok {
		return nil, errors.New("collection not found")
	}

	for _, v := range s.data[collection] {
		if user, ok := v.(*UserWrapper); ok {
			// since our UserWrapper has Email, PasswordHash, etc.
			if field == "email" && user.Email == value {
				return user, nil
			}
		}
	}
	return nil, errors.New("not found")
}

func (s *MemoryStore) Update(collection string, key string, value interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.data[collection]; !ok {
		return errors.New("collection not found")
	}
	s.data[collection][key] = value
	return nil
}
