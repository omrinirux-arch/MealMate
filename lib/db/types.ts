export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface RecipeOption {
  title: string;
  url: string;
  image: string;
  prep_time: string;
  cook_time: string;
  description: string;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
    is_staple: boolean;
  }[];
  tags: string[];
}

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: "admin" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
      staple_items: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      kitchen_tools: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      on_hand_items: {
        Row: {
          id: string;
          household_id: string;
          meal_plan_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          meal_plan_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          meal_plan_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      meal_plans: {
        Row: {
          id: string;
          household_id: string;
          week_start: string;
          status: "draft" | "confirmed" | "archived";
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          week_start: string;
          status?: "draft" | "confirmed" | "archived";
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          week_start?: string;
          status?: "draft" | "confirmed" | "archived";
          created_at?: string;
        };
        Relationships: [];
      };
      meal_plan_days: {
        Row: {
          id: string;
          meal_plan_id: string;
          day_index: number;
          option_a: RecipeOption | null;
          option_b: RecipeOption | null;
          selected_option: "a" | "b" | "skip" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          day_index: number;
          option_a?: RecipeOption | null;
          option_b?: RecipeOption | null;
          selected_option?: "a" | "b" | "skip" | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meal_plan_id?: string;
          day_index?: number;
          option_a?: RecipeOption | null;
          option_b?: RecipeOption | null;
          selected_option?: "a" | "b" | "skip" | null;
          created_at?: string;
        };
        Relationships: [];
      };
      recipe_ratings: {
        Row: {
          id: string;
          household_id: string;
          meal_plan_id: string;
          recipe_url: string;
          recipe_title: string;
          rating: "up" | "down" | null;
          cooked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          meal_plan_id: string;
          recipe_url: string;
          recipe_title: string;
          rating?: "up" | "down" | null;
          cooked_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          meal_plan_id?: string;
          recipe_url?: string;
          recipe_title?: string;
          rating?: "up" | "down" | null;
          cooked_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      grocery_lists: {
        Row: {
          id: string;
          household_id: string;
          meal_plan_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          meal_plan_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          meal_plan_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      grocery_items: {
        Row: {
          id: string;
          grocery_list_id: string;
          name: string;
          quantity: string;
          unit: string;
          aisle: string;
          is_checked: boolean;
          is_manual: boolean;
          source_recipe_title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          grocery_list_id: string;
          name: string;
          quantity: string;
          unit: string;
          aisle: string;
          is_checked?: boolean;
          is_manual?: boolean;
          source_recipe_title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          grocery_list_id?: string;
          name?: string;
          quantity?: string;
          unit?: string;
          aisle?: string;
          is_checked?: boolean;
          is_manual?: boolean;
          source_recipe_title?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      household_preferences: {
        Row: {
          id: string;
          household_id: string;
          dietary_goals: string[];
          recipe_style: string[];
          spice_tolerance: "none" | "mild" | "medium" | "hot";
          exclusions: string[];
          servings: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          dietary_goals?: string[];
          recipe_style?: string[];
          spice_tolerance?: "none" | "mild" | "medium" | "hot";
          exclusions?: string[];
          servings?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          dietary_goals?: string[];
          recipe_style?: string[];
          spice_tolerance?: "none" | "mild" | "medium" | "hot";
          exclusions?: string[];
          servings?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
