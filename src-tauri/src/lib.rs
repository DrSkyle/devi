use tauri::Builder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  Builder::default()
    .setup(|app| {
      #[cfg(desktop)]
      app.handle().plugin(tauri_plugin_shell::init())?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
