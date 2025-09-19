# Custom migrations information

## 0001_unusual_loa.sql

We seed the networks into the Network table directly.

```sql
INSERT INTO "Network" ("network") VALUES
  ('mina:mainnet'),
  ('zeko:mainnet'),
  ('mina:devnet'),
  ('zeko:testnet')
ON CONFLICT ("network") DO NOTHING;
```

Then we migrate the permissions from SignerMerkle to SignerMerkleNetwork, using the new Network table.

```sql
INSERT INTO "SignerMerkleNetwork" ("signer_id", "network", "permission", "active")
SELECT 
    s.id, 
    n.network, 
    CASE 
        WHEN s.permission = 'all' THEN 31
        WHEN s.permission = 'deploy' THEN 1
        ELSE 0 
    END,
    true
FROM "SignerMerkle" s
JOIN "Network" n
  ON n.network IN ('mina:devnet', 'zeko:testnet')
ON CONFLICT DO NOTHING;
```
