export type Database = {
  public: {
    Tables: {
      puzzle_completions: {
        Row: {
          id: string
          user_id: string
          puzzle_id: string
          completed_at: string
          elapsed_ms: number
          hints_used: number
          atq_delta: number
          tier: number
        }
        Insert: {
          id?: string
          user_id: string
          puzzle_id: string
          completed_at?: string
          elapsed_ms: number
          hints_used: number
          atq_delta: number
          tier: number
        }
        Update: {
          id?: string
          user_id?: string
          puzzle_id?: string
          completed_at?: string
          elapsed_ms?: number
          hints_used?: number
          atq_delta?: number
          tier?: number
        }
        Relationships: []
      }
      community_puzzles: {
        Row: {
          id: string
          author_id: string
          title: string
          data: unknown
          published: boolean
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          data: unknown
          published?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          data?: unknown
          published?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          email: string | null
          is_admin: boolean
          atq_score: number
          streak: number
          last_played_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          is_admin?: boolean
          atq_score?: number
          streak?: number
          last_played_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          is_admin?: boolean
          atq_score?: number
          streak?: number
          last_played_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_atq: {
        Args: { user_id: string; delta: number }
        Returns: void
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
