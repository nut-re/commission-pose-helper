# Commission Pose Helper (커미션 신청서 제작 툴)

웹 브라우저에서 직관적으로 캐릭터의 구도(포즈)를 잡고, 소품과 텍스트를 배치하여 **커미션 신청서 및 연성 지시서**를 쉽고 빠르게 제작할 수 있는 웹 기반 툴입니다.

> 🌐 **웹에서 바로 사용하기:** [https://commission-pose-helper.vercel.app/](https://commission-pose-helper.vercel.app/)

---

## 🚀 사용자 가이드 (For Users)

이 툴은 별도의 설치 과정 없이 웹 브라우저에서 바로 사용할 수 있습니다. 완성된 신청서는 이미지 파일(.png)로 다운로드하여 커미션 신청 시 활용할 수 있습니다.

### 주요 기능
* **자유로운 포즈 조작**: 관절(빨간 원)을 드래그하여 원하는 포즈를 세밀하게 조정할 수 있습니다.
* **캐릭터 커스터마이징**: 신체 부위별로 색상을 지정하거나, 피부색 등 전체 테마 색상을 한 번에 변경할 수 있습니다.
* **캔버스 확장**: 자유 텍스트, 도형, 말풍선, 외부 이미지 등을 캔버스에 자유롭게 추가하고 배치할 수 있습니다.
* **캐릭터 추가**: 여러 명의 캐릭터(더미)를 한 화면에 추가하여 다인 구도를 연출할 수 있습니다.
* **손쉬운 내보내기**: 완성된 캔버스를 버튼 클릭 한 번으로 고화질 이미지로 다운로드할 수 있습니다.

---

## 💻 개발자 및 수정자 가이드 (For Developers)

이 프로젝트의 코드를 직접 수정하거나 참고하여 본인만의 툴로 개조하고 싶으신 분들을 위한 안내입니다.

### 기술 스택 및 실행 방법
* **기술 스택**: 순수 바닐라 환경 (HTML, CSS, Vanilla JavaScript)
* **빌드 도구**: 없음 (No Node.js, No Webpack/Vite required)
* **실행 방법**: 프로젝트를 다운로드한 후, 브라우저에서 `index.html` 파일을 열기만 하면 즉시 실행됩니다. (또는 VSCode의 Live Server 등을 활용하셔도 좋습니다.)

### 주요 파일 구조
* `index.html`: 메인 UI 구조 및 스크립트 로드
* `style.css`: 테마, 레이아웃 및 폰트 설정 (Paperlogy 폰트 사용)
* `app.js`: 메인 애플리케이션 로직 및 전역 이벤트 관리
* `skeleton-engine.js`: 관절 역기연학(IK) 및 뼈대 조작 수학 로직 담당
* `modal-manager.js`: UI 모달(도움말 등) 관리 로직
* `history-manager.js`: 실행 취소(Undo)/다시 실행(Redo) 상태 관리
* `free-objects.js` / `image-slots.js` / `text-formatter.js`: 캔버스 내 자유 요소(텍스트, 이미지, 도형) 관리 모듈

---

## 📝 개발자 메시지 및 라이선스 안내

본 프로젝트의 코드는 **MIT License**에 따라 자유롭게 사용 및 수정할 수 있습니다. 

개인적인 취미로 바이브 코딩을 통해 만든 프로젝트로, 제작 과정에서 여러 기존 코드와 오픈소스의 도움을 받았습니다. 가능하다면 취미나 개인적인 용도로 활용해 주시면 감사하겠습니다.

* **License**: [MIT License](./LICENSE) (Copyright (c) 2026 renut)
* **Third-Party Notices**: 본 프로젝트에 사용된 폰트(`Paperlogy`, `Google Fonts`) 및 라이브러리(`html2canvas`, `Font Awesome`)의 라이선스와 출처는 [`THIRD-PARTY-NOTICES.txt`](./THIRD-PARTY-NOTICES.txt) 파일에서 확인하실 수 있습니다.
