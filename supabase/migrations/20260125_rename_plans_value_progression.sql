-- Rename plans to reflect value progression
-- Free → Solo (solo use)
-- Standard → Growth (manage organization)  
-- Enterprise → Scale (get customized functionality)

-- Update plan names in the plans table
UPDATE plans SET name = 'Solo' WHERE name = 'Free';
UPDATE plans SET name = 'Growth' WHERE name = 'Standard';
UPDATE plans SET name = 'Scale' WHERE name = 'Enterprise';

-- Update descriptions to reflect the value proposition
UPDATE plans SET description = 'Perfect for solo productivity' WHERE name = 'Solo';
UPDATE plans SET description = 'Manage your organization effectively' WHERE name = 'Growth';
UPDATE plans SET description = 'Get customized functionality tailored to your needs' WHERE name = 'Scale';
