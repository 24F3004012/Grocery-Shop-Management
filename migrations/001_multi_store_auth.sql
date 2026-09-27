BEGIN;

CREATE TABLE app_user (
  user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE store (
  store_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_user_id INTEGER NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  store_name TEXT NOT NULL CHECK (length(trim(store_name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (owner_user_id)
);

INSERT INTO app_user (email, password_hash)
VALUES ('legacy-owner@local.invalid', '$2b$12$1wjp7hnQmU248UzQOjOXM.9N94cLILnWM7rNxFMeDme4EMb0nPr.S')
RETURNING user_id;

INSERT INTO store (owner_user_id, store_name)
SELECT user_id, 'Sunanda Stores'
FROM app_user
WHERE email = 'legacy-owner@local.invalid';

ALTER TABLE category ADD COLUMN store_id INTEGER;
ALTER TABLE product ADD COLUMN store_id INTEGER;
ALTER TABLE supplier ADD COLUMN store_id INTEGER;
ALTER TABLE customer ADD COLUMN store_id INTEGER;
ALTER TABLE purchase ADD COLUMN store_id INTEGER;
ALTER TABLE purchase_item ADD COLUMN store_id INTEGER;
ALTER TABLE cash_session ADD COLUMN store_id INTEGER;
ALTER TABLE cash_session_item ADD COLUMN store_id INTEGER;
ALTER TABLE credit_sale ADD COLUMN store_id INTEGER;
ALTER TABLE credit_sale_item ADD COLUMN store_id INTEGER;
ALTER TABLE credit_payment ADD COLUMN store_id INTEGER;

UPDATE category SET store_id = (SELECT store_id FROM store LIMIT 1);
UPDATE product SET store_id = (SELECT store_id FROM store LIMIT 1);
UPDATE supplier SET store_id = (SELECT store_id FROM store LIMIT 1);
UPDATE customer SET store_id = (SELECT store_id FROM store LIMIT 1);
UPDATE purchase SET store_id = (SELECT store_id FROM store LIMIT 1);
UPDATE cash_session SET store_id = (SELECT store_id FROM store LIMIT 1);
UPDATE credit_sale SET store_id = (SELECT store_id FROM store LIMIT 1);
UPDATE purchase_item SET store_id = (SELECT store_id FROM purchase WHERE purchase.purchase_id = purchase_item.purchase_id);
UPDATE cash_session_item SET store_id = (SELECT store_id FROM cash_session WHERE cash_session.session_id = cash_session_item.session_id);
UPDATE credit_sale_item SET store_id = (SELECT store_id FROM credit_sale WHERE credit_sale.credit_id = credit_sale_item.credit_id);
UPDATE credit_payment SET store_id = (SELECT store_id FROM customer WHERE customer.customer_id = credit_payment.customer_id);

ALTER TABLE category ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE product ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE supplier ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE customer ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE purchase ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE purchase_item ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE cash_session ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE cash_session_item ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE credit_sale ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE credit_sale_item ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE credit_payment ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE category ADD CONSTRAINT category_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE product ADD CONSTRAINT product_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE supplier ADD CONSTRAINT supplier_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE customer ADD CONSTRAINT customer_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE purchase ADD CONSTRAINT purchase_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE purchase_item ADD CONSTRAINT purchase_item_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE cash_session ADD CONSTRAINT cash_session_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE cash_session_item ADD CONSTRAINT cash_session_item_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE credit_sale ADD CONSTRAINT credit_sale_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE credit_sale_item ADD CONSTRAINT credit_sale_item_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);
ALTER TABLE credit_payment ADD CONSTRAINT credit_payment_store_fk FOREIGN KEY (store_id) REFERENCES store(store_id);

CREATE INDEX product_store_idx ON product(store_id);
CREATE INDEX supplier_store_idx ON supplier(store_id);
CREATE INDEX customer_store_idx ON customer(store_id);
CREATE INDEX purchase_store_idx ON purchase(store_id);
CREATE INDEX cash_session_store_idx ON cash_session(store_id);
CREATE INDEX credit_sale_store_idx ON credit_sale(store_id);
CREATE INDEX credit_payment_store_idx ON credit_payment(store_id);

COMMIT;

-- Replace the legacy placeholder password before allowing that account to log in.
-- This migration is intentionally not executed by the application.
