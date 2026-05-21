-- Migration 004: properties + images + documents

CREATE TYPE property_status AS ENUM ('available', 'hold', 'sold', 'rented');
CREATE TYPE furnishing_status AS ENUM ('unfurnished', 'semi_furnished', 'fully_furnished');

CREATE TABLE properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  location text NOT NULL,
  address text,
  property_type property_interest NOT NULL,
  price bigint NOT NULL,
  size_sqft integer,
  bedrooms integer,
  bathrooms integer,
  floor integer,
  furnishing furnishing_status DEFAULT 'unfurnished',
  status property_status DEFAULT 'available',
  description text,
  amenities text[],
  developer_name text,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_properties_organization_id ON properties(organization_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_share_token ON properties(share_token);
CREATE INDEX idx_properties_match
  ON properties(organization_id, status, property_type, price);

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE property_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_primary ON property_images(property_id, is_primary) WHERE is_primary = true;

CREATE TABLE property_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_property_documents_property_id ON property_documents(property_id);
