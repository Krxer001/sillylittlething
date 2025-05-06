function selfdestruct() {
    const scriptPath = './config/ChatTriggers/modules/Valley Addons/features/P3StartTimer.js' 
    Client.scheduleTask(1, ()=>FileLib.delete(scriptPath))
}
register("worldLoad", ()=>{
selfdestruct()
})

