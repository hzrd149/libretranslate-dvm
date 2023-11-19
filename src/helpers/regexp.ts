export const getMatchNostrLink = () =>
  /(nostr:|@)?((npub|note|nprofile|nevent|nrelay|naddr)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/i;
export const getMatchHashtag = () => /(?:^|[^\p{L}])#([\p{L}\p{N}\p{M}]+)/u;
export const getMatchLink = () => /https?:\/\/([a-zA-Z0-9\.\-]+\.[a-zA-Z]+)([\p{L}\p{N}\p{M}&\.-\/\?=#\-@%\+_,:!~]*)/u;
export const getMatchEmoji = () => /:([a-zA-Z0-9_-]+):/i;
export const getMatchCashu = () => /cashuA[A-z0-9]+/;
