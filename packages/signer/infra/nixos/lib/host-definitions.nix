{
  zeko-testnet-signer = {
    system = "x86_64-linux";
    module = ../hosts/zeko-testnet-signer.nix;
  };

  mina-mainnet-signer = {
    system = "x86_64-linux";
    module = ../hosts/mina-mainnet-signer.nix;
  };

  zeko-mainnet-signer = {
    system = "x86_64-linux";
    module = ../hosts/zeko-mainnet-signer.nix;
  };

  local-arm64-signer-test = {
    system = "aarch64-linux";
    module = ../hosts/local-arm64-signer-test.nix;
  };
}
