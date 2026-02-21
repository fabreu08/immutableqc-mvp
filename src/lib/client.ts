import { createThirdwebClient } from "thirdweb";

// Use the value from the "Client ID" box
const clientId = "15ef01b2c2a1b186f2edc80db8da86b1"; 

export const client = createThirdwebClient({
  clientId: clientId,
});