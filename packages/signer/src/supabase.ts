export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			graphql: {
				Args: {
					operationName?: string
					query?: string
					variables?: Json
					extensions?: Json
				}
				Returns: Json
			}
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	public: {
		Tables: {
			Merkle: {
				Row: {
					active: boolean
					created_at: string
					id: string
					right: string
					user: string
				}
				Insert: {
					active?: boolean
					created_at?: string
					id?: string
					right: string
					user: string
				}
				Update: {
					active?: boolean
					created_at?: string
					id?: string
					right?: string
					user?: string
				}
				Relationships: []
			}
			Multisig: {
				Row: {
					created_at: string
					data: string
					deadline: number
					id: string
					signature: string
					signer: string
				}
				Insert: {
					created_at?: string
					data: string
					deadline: number
					id?: string
					signature: string
					signer: string
				}
				Update: {
					created_at?: string
					data?: string
					deadline?: number
					id?: string
					signature?: string
					signer?: string
				}
				Relationships: [
					{
						foreignKeyName: "Multisig_signer_fkey"
						columns: ["signer"]
						isOneToOne: false
						referencedRelation: "Merkle"
						referencedColumns: ["user"]
					}
				]
			}
			Pool: {
				Row: {
					created_at: string
					deployed: boolean
					id: string
					public_key: string
					token_a: string
					token_b: string
					user: string
				}
				Insert: {
					created_at?: string
					deployed?: boolean
					id?: string
					public_key: string
					token_a: string
					token_b: string
					user: string
				}
				Update: {
					created_at?: string
					deployed?: boolean
					id?: string
					public_key?: string
					token_a?: string
					token_b?: string
					user?: string
				}
				Relationships: []
			}
			PoolKey: {
				Row: {
					created_at: string
					encrypted_key: string
					id: string
					public_key: string
					signer_1: string
					signer_2: string
				}
				Insert: {
					created_at?: string
					encrypted_key: string
					id?: string
					public_key: string
					signer_1: string
					signer_2: string
				}
				Update: {
					created_at?: string
					encrypted_key?: string
					id?: string
					public_key?: string
					signer_1?: string
					signer_2?: string
				}
				Relationships: [
					{
						foreignKeyName: "PoolKey_public_key_fkey"
						columns: ["public_key"]
						isOneToOne: false
						referencedRelation: "Pool"
						referencedColumns: ["public_key"]
					},
					{
						foreignKeyName: "PoolKey_signer_1_fkey"
						columns: ["signer_1"]
						isOneToOne: false
						referencedRelation: "Merkle"
						referencedColumns: ["user"]
					},
					{
						foreignKeyName: "PoolKey_signer_2_fkey"
						columns: ["signer_2"]
						isOneToOne: false
						referencedRelation: "Merkle"
						referencedColumns: ["user"]
					}
				]
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R
			}
			? R
			: never
		: never

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I
			}
			? I
			: never
		: never

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U
			}
			? U
			: never
		: never

export type Enums<
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never

export const Constants = {
	graphql_public: {
		Enums: {}
	},
	public: {
		Enums: {}
	}
} as const
