-- Add Foreign Key to transactions table to link user_id to profiles
-- This enables: .select('*, profiles(*)')

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_user_id_fkey' 
        AND table_name = 'transactions'
    ) THEN 
        ALTER TABLE "transactions" 
        ADD CONSTRAINT "transactions_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "profiles" ("id") 
        ON DELETE SET NULL;
    END IF; 
END $$;
