-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Merkle (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user character varying NOT NULL UNIQUE,
  right character varying NOT NULL,
  CONSTRAINT Merkle_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Multisig (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  signer character varying NOT NULL,
  signature character varying NOT NULL,
  data character varying NOT NULL,
  deadline numeric NOT NULL,
  CONSTRAINT Multisig_pkey PRIMARY KEY (id),
  CONSTRAINT Multisig_signer_fkey FOREIGN KEY (signer) REFERENCES public.Merkle(user)
);
CREATE TABLE public.Pool (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  token_a character varying NOT NULL,
  token_b character varying NOT NULL,
  public_key character varying NOT NULL UNIQUE,
  user character varying NOT NULL,
  deployed boolean NOT NULL DEFAULT false,
  CONSTRAINT Pool_pkey PRIMARY KEY (id)
);
CREATE TABLE public.PoolKey (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  public_key character varying NOT NULL,
  CONSTRAINT PoolKey_pkey PRIMARY KEY (id),
  CONSTRAINT PoolKey_public_key_fkey FOREIGN KEY (public_key) REFERENCES public.Pool(public_key)
);