-- Force schema cache reload just in case
NOTIFY pgrst, 'reload schema';

-- Explicitly drop and re-add the constraint to ensure it is registered correctly
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_user_id_fkey";

ALTER TABLE "transactions" 
    ADD CONSTRAINT "transactions_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "profiles" ("id") 
    ON DELETE SET NULL;
