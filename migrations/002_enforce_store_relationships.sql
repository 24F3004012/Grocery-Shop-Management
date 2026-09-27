BEGIN;

ALTER TABLE purchase ADD CONSTRAINT purchase_id_store_unique UNIQUE (purchase_id, store_id);
ALTER TABLE cash_session ADD CONSTRAINT cash_session_id_store_unique UNIQUE (session_id, store_id);
ALTER TABLE credit_sale ADD CONSTRAINT credit_sale_id_store_unique UNIQUE (credit_id, store_id);

ALTER TABLE purchase_item ADD CONSTRAINT purchase_item_store_parent_fk FOREIGN KEY (purchase_id, store_id) REFERENCES purchase (purchase_id, store_id);
ALTER TABLE cash_session_item ADD CONSTRAINT cash_session_item_store_parent_fk FOREIGN KEY (session_id, store_id) REFERENCES cash_session (session_id, store_id);
ALTER TABLE credit_sale_item ADD CONSTRAINT credit_sale_item_store_parent_fk FOREIGN KEY (credit_id, store_id) REFERENCES credit_sale (credit_id, store_id);

CREATE OR REPLACE FUNCTION adjust_stock_for_purchase_item()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product SET stock_on_hand = stock_on_hand + NEW.quantity WHERE product_id = NEW.product_id AND store_id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product SET stock_on_hand = stock_on_hand - OLD.quantity WHERE product_id = OLD.product_id AND store_id = OLD.store_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION adjust_stock_for_cash_session_item()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product SET stock_on_hand = stock_on_hand - NEW.quantity WHERE product_id = NEW.product_id AND store_id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product SET stock_on_hand = stock_on_hand + OLD.quantity WHERE product_id = OLD.product_id AND store_id = OLD.store_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION adjust_stock_for_credit_sale_item()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product SET stock_on_hand = stock_on_hand - NEW.quantity WHERE product_id = NEW.product_id AND store_id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product SET stock_on_hand = stock_on_hand + OLD.quantity WHERE product_id = OLD.product_id AND store_id = OLD.store_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION adjust_balance_for_credit_sale()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customer SET balance_due = balance_due + NEW.total_amount WHERE customer_id = NEW.customer_id AND store_id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE customer SET balance_due = balance_due - OLD.total_amount WHERE customer_id = OLD.customer_id AND store_id = OLD.store_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION adjust_balance_for_credit_payment()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customer SET balance_due = balance_due - NEW.amount_paid WHERE customer_id = NEW.customer_id AND store_id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE customer SET balance_due = balance_due + OLD.amount_paid WHERE customer_id = OLD.customer_id AND store_id = OLD.store_id;
  END IF;
  RETURN NULL;
END;
$$;

COMMIT;