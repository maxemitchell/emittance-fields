export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					operationName?: string;
					query?: string;
					variables?: Json;
					extensions?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			emitters: {
				Row: {
					color: string;
					created_at: string;
					field_id: string;
					id: string;
					updated_at: string;
					x: number;
					y: number;
				};
				Insert: {
					color?: string;
					created_at?: string;
					field_id: string;
					id?: string;
					updated_at?: string;
					x: number;
					y: number;
				};
				Update: {
					color?: string;
					created_at?: string;
					field_id?: string;
					id?: string;
					updated_at?: string;
					x?: number;
					y?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'emitters_field_id_fkey';
						columns: ['field_id'];
						isOneToOne: false;
						referencedRelation: 'fields';
						referencedColumns: ['id'];
					}
				];
			};
			field_collaborators: {
				Row: {
					created_at: string;
					field_id: string;
					id: string;
					role: Database['public']['Enums']['collaborator_role'];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					field_id: string;
					id?: string;
					role?: Database['public']['Enums']['collaborator_role'];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					field_id?: string;
					id?: string;
					role?: Database['public']['Enums']['collaborator_role'];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'field_collaborators_field_id_fkey';
						columns: ['field_id'];
						isOneToOne: false;
						referencedRelation: 'fields';
						referencedColumns: ['id'];
					}
				];
			};
			fields: {
				Row: {
					background_color: string;
					created_at: string;
					description: string | null;
					height: number;
					id: string;
					is_public: boolean;
					name: string;
					owner_id: string;
					updated_at: string;
					width: number;
				};
				Insert: {
					background_color?: string;
					created_at?: string;
					description?: string | null;
					height: number;
					id?: string;
					is_public?: boolean;
					name: string;
					owner_id: string;
					updated_at?: string;
					width: number;
				};
				Update: {
					background_color?: string;
					created_at?: string;
					description?: string | null;
					height?: number;
					id?: string;
					is_public?: boolean;
					name?: string;
					owner_id?: string;
					updated_at?: string;
					width?: number;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			has_field_access: {
				Args: { field_uuid: string };
				Returns: boolean;
			};
			has_field_editor_access: {
				Args: { field_uuid: string };
				Returns: boolean;
			};
			is_field_owner: {
				Args: { field_uuid: string };
				Returns: boolean;
			};
			is_field_public: {
				Args: { field_uuid: string };
				Returns: boolean;
			};
		};
		Enums: {
			collaborator_role: 'viewer' | 'editor';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {}
	},
	public: {
		Enums: {
			collaborator_role: ['viewer', 'editor']
		}
	}
} as const;
