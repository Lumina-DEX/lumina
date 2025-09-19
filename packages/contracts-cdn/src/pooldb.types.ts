export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "13.0.4"
	}
	public: {
		Tables: {
			Factory: {
				Row: {
					created_at: string
					id: number
					network: string
					public_key: string
					user: string
				}
				Insert: {
					created_at?: string
					id?: number
					network: string
					public_key: string
					user: string
				}
				Update: {
					created_at?: string
					id?: number
					network?: string
					public_key?: string
					user?: string
				}
				Relationships: [
					{
						foreignKeyName: "Factory_network_Network_network_fk"
						columns: ["network"]
						isOneToOne: false
						referencedRelation: "Network"
						referencedColumns: ["network"]
					}
				]
			}
			Multisig: {
				Row: {
					created_at: string
					data: string
					deadline: number
					id: number
					network: string
					signature: string
					signer: number
				}
				Insert: {
					created_at?: string
					data: string
					deadline: number
					id?: number
					network: string
					signature: string
					signer: number
				}
				Update: {
					created_at?: string
					data?: string
					deadline?: number
					id?: number
					network?: string
					signature?: string
					signer?: number
				}
				Relationships: [
					{
						foreignKeyName: "Multisig_network_Network_network_fk"
						columns: ["network"]
						isOneToOne: false
						referencedRelation: "Network"
						referencedColumns: ["network"]
					},
					{
						foreignKeyName: "Multisig_signer_SignerMerkle_id_fk"
						columns: ["signer"]
						isOneToOne: false
						referencedRelation: "SignerMerkle"
						referencedColumns: ["id"]
					}
				]
			}
			Network: {
				Row: {
					created_at: string
					network: string
				}
				Insert: {
					created_at?: string
					network: string
				}
				Update: {
					created_at?: string
					network?: string
				}
				Relationships: []
			}
			Pool: {
				Row: {
					created_at: string
					id: number
					job_id: string
					network: string
					public_key: string
					status: string
					token_a: string
					token_b: string
					user: string
				}
				Insert: {
					created_at?: string
					id?: number
					job_id: string
					network: string
					public_key: string
					status: string
					token_a: string
					token_b: string
					user: string
				}
				Update: {
					created_at?: string
					id?: number
					job_id?: string
					network?: string
					public_key?: string
					status?: string
					token_a?: string
					token_b?: string
					user?: string
				}
				Relationships: [
					{
						foreignKeyName: "Pool_network_Network_network_fk"
						columns: ["network"]
						isOneToOne: false
						referencedRelation: "Network"
						referencedColumns: ["network"]
					}
				]
			}
			PoolKey: {
				Row: {
					created_at: string
					encrypted_key: string
					factory_id: number | null
					generated_public_1: string
					generated_public_2: string
					id: number
					pool_id: number
					signer_1: number
					signer_2: number
				}
				Insert: {
					created_at?: string
					encrypted_key: string
					factory_id?: number | null
					generated_public_1: string
					generated_public_2: string
					id?: number
					pool_id: number
					signer_1: number
					signer_2: number
				}
				Update: {
					created_at?: string
					encrypted_key?: string
					factory_id?: number | null
					generated_public_1?: string
					generated_public_2?: string
					id?: number
					pool_id?: number
					signer_1?: number
					signer_2?: number
				}
				Relationships: [
					{
						foreignKeyName: "PoolKey_factory_id_Factory_id_fk"
						columns: ["factory_id"]
						isOneToOne: false
						referencedRelation: "Factory"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "PoolKey_pool_id_Pool_id_fk"
						columns: ["pool_id"]
						isOneToOne: false
						referencedRelation: "Pool"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "PoolKey_signer_1_SignerMerkle_id_fk"
						columns: ["signer_1"]
						isOneToOne: false
						referencedRelation: "SignerMerkle"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "PoolKey_signer_2_SignerMerkle_id_fk"
						columns: ["signer_2"]
						isOneToOne: false
						referencedRelation: "SignerMerkle"
						referencedColumns: ["id"]
					}
				]
			}
			SignerMerkle: {
				Row: {
					created_at: string
					id: number
					public_key: string
				}
				Insert: {
					created_at?: string
					id?: number
					public_key: string
				}
				Update: {
					created_at?: string
					id?: number
					public_key?: string
				}
				Relationships: []
			}
			SignerMerkleNetwork: {
				Row: {
					active: boolean
					created_at: string
					id: number
					network: string
					permission: number
					signer_id: number
				}
				Insert: {
					active?: boolean
					created_at?: string
					id?: number
					network: string
					permission: number
					signer_id: number
				}
				Update: {
					active?: boolean
					created_at?: string
					id?: number
					network?: string
					permission?: number
					signer_id?: number
				}
				Relationships: [
					{
						foreignKeyName: "SignerMerkleNetwork_network_Network_network_fk"
						columns: ["network"]
						isOneToOne: false
						referencedRelation: "Network"
						referencedColumns: ["network"]
					},
					{
						foreignKeyName: "SignerMerkleNetwork_signer_id_SignerMerkle_id_fk"
						columns: ["signer_id"]
						isOneToOne: false
						referencedRelation: "SignerMerkle"
						referencedColumns: ["id"]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never

export const Constants = {
	public: {
		Enums: {}
	}
} as const
