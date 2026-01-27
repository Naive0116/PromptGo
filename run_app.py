"""
PromptForge 桌面启动器
启动后端 API 服务和前端静态文件服务，并自动打开浏览器
"""
import subprocess
import sys
import os
import webbrowser
import time
import threading
import signal

def get_base_path():
    """获取应用程序基础路径（支持 PyInstaller 打包后的路径）"""
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def find_python():
    """查找 Python 解释器"""
    if getattr(sys, 'frozen', False):
        return sys.executable
    return sys.executable

backend_process = None
frontend_process = None

def start_backend():
    """启动 FastAPI 后端服务"""
    global backend_process
    base_path = get_base_path()
    backend_path = os.path.join(base_path, 'backend')
    
    env = os.environ.copy()
    env['PYTHONPATH'] = backend_path
    
    backend_process = subprocess.Popen(
        [find_python(), '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
        cwd=backend_path,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    print("后端服务已启动: http://127.0.0.1:8000")

def start_frontend():
    """启动前端静态文件服务"""
    global frontend_process
    base_path = get_base_path()
    frontend_dist_path = os.path.join(base_path, 'frontend', 'dist')
    
    if not os.path.exists(frontend_dist_path):
        print(f"错误: 前端构建目录不存在: {frontend_dist_path}")
        return
    
    frontend_process = subprocess.Popen(
        [find_python(), '-m', 'http.server', '5174'],
        cwd=frontend_dist_path,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    print("前端服务已启动: http://127.0.0.1:5174")

def cleanup(signum=None, frame=None):
    """清理进程"""
    print("\n正在关闭服务...")
    if backend_process:
        backend_process.terminate()
    if frontend_process:
        frontend_process.terminate()
    sys.exit(0)

def main():
    print("=" * 50)
    print("  PromptForge - 提示词生成助手")
    print("=" * 50)
    print()
    
    # 注册信号处理
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    # 启动后端
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # 等待后端启动
    time.sleep(3)
    
    # 启动前端
    frontend_thread = threading.Thread(target=start_frontend, daemon=True)
    frontend_thread.start()
    
    # 等待前端启动
    time.sleep(1)
    
    # 打开浏览器
    print("\n正在打开浏览器...")
    webbrowser.open('http://127.0.0.1:5174')
    
    print("\n服务已启动！")
    print("- 前端: http://127.0.0.1:5174")
    print("- 后端: http://127.0.0.1:8000")
    print("\n按 Ctrl+C 退出程序")
    
    try:
        while True:
            time.sleep(1)
            # 检查进程是否还在运行
            if backend_process and backend_process.poll() is not None:
                print("后端服务已停止")
                break
    except KeyboardInterrupt:
        cleanup()

if __name__ == '__main__':
    main()
