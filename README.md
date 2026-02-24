# Beat Saber Playlist Manager (bplist)

비트세이버(Beat Saber)의 플레이리스트 파일(`.bplist`)을 웹 브라우저에서 간편하게 열고, 편집하고, 관리할 수 있는 도구입니다.

![Beat Saber Theme](https://img.shields.io/badge/Theme-Beat%20Saber-FF0055?style=for-the-badge&logo=beatsaber)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

## ✨ 주요 기능

- **📂 스마트 파일 처리**: `.bplist` 파일을 드래그 앤 드롭으로 즉시 열 수 있으며, 한글 깨짐 문제를 완벽히 해결했습니다.
- **🔍 강력한 이미지 검색**: iTunes API를 연동하여 고화질 앨범 아트를 무한 스크롤로 검색할 수 있습니다.
- **🖼️ 스마트 커버 편집**: 어떤 비율의 이미지라도 정중앙 1:1 비율로 정교하게 크롭하며, 300x300 리사이징 및 하단 텍스트 합성 기능을 제공합니다.
- **📂 실제 곡 폴더 연동**: 게임 내 노래 폴더를 선택하면 `Key`, `Name` 추출은 물론, 정식 `SHA-1 해시`를 자동으로 계산하여 추가해줍니다.
- **📝 정교한 수동 추가**: Uploader, Hash, LevelID 등 모든 메타데이터를 직접 입력할 수 있는 전용 모달을 지원합니다.
- **🖥️ JSON 실시간 확인**: 편집 중인 플레이리스트의 원본 JSON 구조를 즉시 확인할 수 있습니다.

## 🚀 시작하기

이 프로젝트는 서버 설치가 필요 없는 **Pure Client-side** 웹 애플리케이션입니다.

1. 이 저장소를 클론(Clone)하거나 ZIP으로 다운로드합니다.
2. `index.html` 파일을 웹 브라우저(Chrome 권장)로 엽니다.
3. 수정하고 싶은 `.bplist` 파일을 화면에 끌어다 놓으세요!

## ⚠️ 안내 사항

- **개인정보 보호**: 모든 파일 데이터와 이미지 처리는 사용자님의 브라우저 내(로컬 디바이스)에서만 이루어집니다. 외부 서버로 파일이 전송되지 않으니 안심하고 사용하세요.
- **저장소**: 수정한 파일은 브라우저의 다운로드 기능을 통해 새 `.bplist` 파일로 저장됩니다. 이를 비트세이버의 `Playlists` 폴더에 덮어쓰시면 됩니다.

## 🛠️ 기술 스택

- **Core**: HTML5, Vanilla CSS, JavaScript (ES6+)
- **APIs**: iTunes Search API, Web Crypto API (SHA-1), Canvas API

---
Developed with ❤️ by [Assistant] for Beat Saber Players.
