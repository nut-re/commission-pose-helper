const I18N_DICT = {
  ko: {
    lang_name: "한국어",
    header_title: "Commission Helper – 커미션 신청서 제작 툴",
    header_sub: "커미션 신청서 제작 툴",
    btn_tutorial_title: "사용 안내 보기",
    btn_undo_title: "실행 취소 (Ctrl+Z)",
    btn_redo_title: "다시 실행 (Ctrl+Y)",
    
    btn_reset: " 초기화",
    btn_load: " 불러오기",
    btn_save: " 저장",
    btn_save_preset: "저장",
    status_export_done: "이미지 내보내기가 완료되었습니다.",
    status_pose_copy: "포즈가 복사되었습니다.",
    status_pose_paste: "포즈를 붙여넣기 했습니다.",
    status_item_del: "요소가 삭제되었습니다.",
    status_char_add: "인물이 추가되었습니다.",
    status_img_add: "이미지가 추가되었습니다.",
    status_reset: "전체 초기화 되었습니다.",
    status_proj_save: "프로젝트가 저장되었습니다.",
    status_proj_load: "프로젝트를 불러왔습니다.",
    export_scope: "내보내기 범위 선택",
    export_scale: "내보내기 배율",
    opt_all: "🌟 전체 합본 (포즈 + 모든 캐릭터)",
    opt_all_split: "⚖️ 캔버스 중앙 + 캐릭터 양분할",
    opt_current: "👤 현재 캐릭터만 (포즈 + 1인)",
    opt_sheets: "📑 캐릭터 시트만 (N인 가로 합본)",
    opt_current_sheet: "📄 현재 캐릭터 시트만 (1인 단독)",
    opt_canvas: "🖼️ 포즈 캔버스만",
    
    panel_canvas: "캔버스",
    lbl_ratio: "종횡비",
    opt_sq: "정사각형 (1:1)",
    opt_v34: "세로 (3:4)",
    opt_v23: "세로 (2:3)",
    opt_v916: "세로 (9:16)",
    opt_h43: "가로 (4:3)",
    opt_h169: "가로 (16:9)",
    opt_h31: "가로 헤더 (3:1)",
    opt_custom: "사용자 지정",
    lbl_cw: "가로 비율",
    lbl_ch: "세로 비율",
    lbl_bg: "캔버스 배경",
    
    panel_tools: "그리기 도구",
    tool_select: "선택 (V)",
    tool_pen: "펜 (P)",
    tool_eraser: "지우개 (E)",
    tool_text: "텍스트 (T)",
    tool_arrow: "화살표 (A)",
    tool_rect: "사각형 (R)",
    tool_circle: "원 (C)",
    tool_img: "이미지 삽입",
    lbl_stroke_width: "선/테두리 굵기",
    lbl_style: "스타일",
    opt_style_stroke: "기본",
    opt_style_fill: "채우기 (도형 전용)",
    opt_style_both: "검은 테두리 추가",
    opt_style_outline: "흰 테두리 추가",
    
    panel_colors: "색상",
    btn_eye_title: "스포이드",
    btn_add_char: "인물 추가",
    
    comp_title: "구도 설명",
    comp_pl: "- 전체적인 구도, 카메라 시점, 조명/분위기 등을 서술해 주세요.",
    
    lbl_sel_obj: "선택 객체",
    lbl_edit_mode: "편집 모드",
    btn_mode_xform: "전체 변형",
    btn_mode_pose: "관절 포즈",
    btn_flip: "좌우반전",
    btn_reset_pose: "포즈 초기화",
    btn_copy_pose: "포즈 복사",
    btn_paste_pose: "포즈 붙여넣기",
    
    lbl_part_sel: "선택된 파츠 (레이어 전용)",
    opt_part_all: "전체",
    opt_part_head: "머리",
    opt_part_neck: "목",
    opt_part_chest: "상체",
    opt_part_waist: "허리",
    opt_part_pelvis: "골반",
    opt_part_lUpperArm: "왼 위팔",
    opt_part_lLowerArm: "왼 아래팔",
    opt_part_lHand: "왼 손",
    opt_part_rUpperArm: "오른 위팔",
    opt_part_rLowerArm: "오른 아래팔",
    opt_part_rHand: "오른 손",
    opt_part_lThigh: "왼 허벅지",
    opt_part_lCalf: "왼 종아리",
    opt_part_lFoot: "왼 발",
    opt_part_rThigh: "오른 허벅지",
    opt_part_rCalf: "오른 종아리",
    opt_part_rFoot: "오른 발",
    
    lbl_layer_def: "기본",
    btn_layer_front: "맨 앞",
    btn_layer_fwd: "앞으로",
    btn_layer_bwd: "뒤로",
    btn_layer_back: "맨 뒤",
    lbl_layer: "레이어",
    
    lbl_txt_content: "텍스트 내용",
    pl_txt_content: "내용을 입력하세요",
    lbl_txt_size: "글자 크기",
    txt_hint: "💡 글자를 더블클릭해도 바로 수정할 수 있어요",
    lbl_scale: "크기",
    btn_reset_scale: "기본 크기로 리셋",
    btn_dup: "복제",
    btn_del: "삭제",
    
    lbl_pose_presets: "포즈 프리셋",
    pose_apply: " 포즈 적용",
    
    lbl_theme_link: "테마 연동",
    lbl_theme_link_sub: "🔗 시트 테마와 연동",
    lbl_theme_color: "테마 색상",
    lbl_theme_hdr: "헤더 바 색상",
    lbl_theme_sub_bg: "서브 타이틀 배경",
    lbl_theme_bg: "전체 배경색",
    lbl_theme_body: "본문 글자색",
    lbl_font_setting: "글자 설정",
    lbl_font_weight: "글자 굵기",
    opt_fw_300: "얇게 (Light)",
    opt_fw_400: "보통 (Regular)",
    opt_fw_500: "중간 (Medium)",
    opt_fw_700: "굵게 (Bold)",
    btn_reset_val: "기본값으로 초기화",
    
    tab_solid: "단색",
    tab_grad: "그라디언트",
    tab_img: "이미지",
    tab_shape: "도형 그리기",
    btn_reset_white: "흰색으로 초기화",
    lbl_dir: "방향",
    dir_180: "위 → 아래",
    dir_90: "왼 → 오른",
    dir_135: "↖ → ↘",
    dir_45: "↙ → ↗",
    lbl_color_stop: "색상 정지점",
    btn_add_color: "색상 추가",
    lbl_use_shape: "도형 레이어 사용",
    btn_del_img_label: "이미지 제거",
    
    sheet_orig_name: "원어 이름",
    sheet_spec: "키 / 체형",
    sheet_keyword: "#키워드 #키워드",
    sheet_keypoint_title: "중요 포인트",
    sheet_keypoint_pl: "빠지면 안 되는 중요한 특징을 서술해 주세요.",
    sheet_feature_title: "외관 특징",
    sheet_feature_sub: "보는 사람 기준 서술",
    sheet_feature_pl: "- 외관 특징을 서술해 주세요.",
    sheet_source: "출처 :",
    sheet_source_pl: "@nut__commission / 등 자료 출처",
    txt_watermark: "틀 제작 @nut__guryoyo",
    title_creator: "제작자",
    btn_theme_font: "테마/폰트",
    btn_theme_font_title: "구도 설명란 테마 및 폰트 설정",
    
    lbl_drop_img: "클릭 또는 드래그",
    btn_theme_toggle: "시트 테마",
    btn_add_img: "이미지 추가",
    btn_add_text: "텍스트 추가",
    
    btn_sheet_theme_title: "신청서 테마 색상 일괄 변경",
    btn_add_img_title: "패널 여백에 자유 이미지 추가",
    btn_add_text_title: "패널 여백에 자유 텍스트 추가",
    lbl_theme_popup_title: "시트 테마 컬러",
    lbl_link_dummy: "인물(더미) 색상과 연동",
    btn_apply_all_sheets: "모든 시트에 동일 테마 적용",
    btn_apply: "적용",
    lbl_theme_presets: "테마 프리셋",
    lbl_theme_custom: "세부 색상 커스텀",
    lbl_theme_main: "메인 테마",
    lbl_theme_sub: "서브 배경",
    lbl_theme_title_txt: "제목 글자",
    lbl_theme_body_txt: "본문 글자",
    lbl_theme_sheet_bg: "시트 배경",
    btn_reset_theme_charcoal: "기본 차콜 테마로 리셋",
    
    btn_apply_done: "✓ 완료",
    btn_apply_title: "현재 테마를 모든 캐릭터 시트에 일괄 적용합니다.",
    
    btn_close: "닫기",
    btn_close_title: "닫기",
    btn_close_preview_aria: "미리보기 닫기",
    btn_close: "닫기",
    btn_close_title: "닫기",
    btn_close_preview_aria: "미리보기 닫기",
    btn_close_crop_aria: "크롭 창 닫기",
    
    modal_preview_title: "내보내기 미리보기",
    btn_save: "저장",
    lbl_stroke_w: "선/테두리 굵기",
    lbl_style: "스타일",
    opt_style_stroke: "기본",
    opt_style_fill: "채우기 (도형 전용)",
    opt_style_both: "검은 테두리 추가",
    opt_style_outline_white: "흰 테두리 추가",
    lbl_txt_content: "텍스트 내용",
    lbl_txt_size: "글자 크기",
    txt_edit_hint: "글자를 더블클릭해도 바로 수정할 수 있어요",
    btn_fold_comp_title: "구도 설명란 접기/펼치기",
    tab_char_sheet_title: "캐릭터 {0}. 시트 (드래그하여 순서 변경 가능)",
    tab_char_sheet_aria: "캐릭터 {0} 시트",
    msg_del_char_sheet: "캐릭터 [ {0} ] 시트를 정말 삭제하시겠습니까?<br>작성된 프로필 텍스트와 업로드한 이미지가 모두 삭제됩니다.",
    msg_max_char: "캐릭터 시트는 최대 8명까지 추가할 수 있습니다.",
    txt_input_default: "텍스트 입력",
    btn_layer_fwd: "앞으로",
    btn_layer_bwd: "뒤로",
    btn_layer_back: "맨 뒤",
    btn_del: "삭제",
    lbl_layer: "레이어",
    lbl_part_sel: "선택된 파츠 (레이어 전용)",
    btn_add_char: "인물 추가",
    btn_add_char_title: "새 캐릭터 정보 시트 추가",
    txt_watermark: "틀 제작 @nut__guryoyo",
    title_creator: "제작자",
    lbl_theme_bg: "전체 배경색",
    sheet_orig_name: "원어 이름",
    sheet_keyword: "#키워드 #키워드",
    sheet_keypoint_pl: "빠지면 안 되는 중요한 특징을 서술해 주세요.",
    sheet_feature_title: "외관 특징",
    sheet_feature_pl: "- 외관 특징을 서술해 주세요.",
    sheet_spec: "키 / 체형",
    btn_align_toggle: "텍스트 정렬 전환 (좌/중/우)",
    txt_resolution: "출력 해상도: ",
    scope_all: "전체 합본",
    scope_all_split: "캔버스 중앙 양분할",
    scope_current: "현재 1인",
    scope_sheets_only: "시트만",
    scope_current_sheet: "현재 1인 시트만",
    scope_pose_only: "포즈만",
    lbl_slot_bg: "슬롯 배경색",
    btn_remove_img_title: "이미지 제거",
    btn_reset_rot_title: "회전 0° 리셋",
    btn_reset_scale_title: "기본 크기로 리셋",
    btn_replace_img_title: "이미지 교체",
    btn_bg_color_title: "배경색",
    title_reset_0: "클릭 시 0°로 리셋",
    lbl_scale: "크기",
    lbl_pose_presets: "포즈 프리셋",
    
    theme_mono: "모노 차콜",
    theme_rose: "로즈 핑크",
    theme_ocean: "오션 블루",
    theme_sage: "세이지 그린",
    theme_purple: "라벤더 퍼플",
    theme_mint: "아쿠아 민트",
    theme_honey: "허니 베이지",
    theme_mocha: "모카 브라운",
    
    tool_font_dec: "폰트 크기 줄이기",
    tool_font_inc: "폰트 크기 키우기",
    tool_font_bold: "선택 부분 / 전체 굵게 (Bold)",
    tool_font_italic: "선택 부분 / 전체 기울임 (Italic)",
    tool_font_bullet: "말머리 기호 삽입",
    tool_font_reset: "서식 초기화",
    
    btn_rot_drag: "드래그하여 회전",
    btn_text_style: "텍스트 서식/스타일",
    btn_layer_front: "맨 위로 보내기",
    btn_layer_back: "맨 아래로 보내기",
    btn_text_bold: "굵게",
    btn_text_bold_label: "B (굵은 글씨)",
    tab_color: "색상",
    tab_color_title: "단색",
    tab_grad: "그라디",
    tab_grad_title: "그라디언트",
    tab_img: "이미지",
    tab_img_title: "이미지",
    tab_draw: "도형",
    tab_draw_title: "도형 그리기",
    lbl_direction: "방향",
    lbl_color: "색상",
    btn_remove_this_color: "이 색상 제거",
    lbl_size: "크기",
    btn_remove_img: "이미지 제거",
    lbl_shape_layer: "도형 레이어 적용",
    lbl_shape: "도형",
    shape_circle: "채워진 원",
    shape_oval: "세로 타원 (동공)",
    shape_ring: "선만 있는 원 (윤곽)",
    shape_dot: "작은 채워진 원",
    shape_bullseye: "외곽 링 + 중심 점 (◎)",
    shape_sparkle: "반짝이 4포인트 (✦)",
    btn_panel_expand: "신청서 패널 펼치기",
    btn_panel_collapse: "신청서 패널 접기",
    btn_comp_expand: "구도 설명란 펼치기",
    btn_comp_collapse: "구도 설명란 접기",

    
    msg_need_char: "포즈를 적용할 인물을 먼저 선택해 주세요.",
    msg_reset_warn: "정말 전체 초기화하시겠습니까?<br>작성 중인 모든 오브젝트와 참고자료가 완전히 삭제됩니다.",
    msg_del_img: "이 이미지를 삭제하시겠습니까?",
    msg_del_preset: "'{0}' 프리셋을 삭제하시겠습니까?",
    btn_del_preset: "프리셋 삭제",
    title_save_preset: "현재 선택된 포즈를 이 슬롯에 저장",
    msg_input_preset: "새 프리셋 이름을 입력해 주세요:",
    
    badge_fwd: "앞",
    badge_bwd: "뒤",
    badge_overtake: "개 추월",
    badge_behind: "개 뒤로",
    badge_th: "번째",
    
    modal_confirm_title: "확인",
    modal_prompt_title: "입력",
    modal_alert_title: "알림",
    btn_cancel: "취소",
    btn_ok: "확인",
    
    btn_reset_title: "초기화",
    btn_load_title: "프로젝트 불러오기",
    btn_save_title: "프로젝트 저장",
    btn_preview_title: "출력 이미지 미리보기",
    btn_export_aria: "이미지 내보내기",
    btn_reset_layer: "레이어 오프셋 초기화",
    
    "pose_기본 스탠딩1": "기본 스탠딩1",
    "pose_기본 스탠딩2": "기본 스탠딩2",
    "pose_기본 스탠딩3": "기본 스탠딩3",
    pose_주머니손: "주머니 손",
    "pose_주머니 손": "주머니 손",
    pose_팔짱낌: "팔짱 낌",
    "pose_팔짱 낌": "팔짱 낌",
    pose_양손모음: "양손모음",
    pose_목에손1: "목에 손 1",
    "pose_목에 손 1": "목에 손 1",
    pose_목에손2: "목에 손 2",
    "pose_목에 손 2": "목에 손 2",
    "pose_강하고 이상한놈": "강하고 이상한놈",
    pose_팔스트레칭: "팔 스트레칭",
    "pose_팔 스트레칭": "팔 스트레칭",
    pose_무릎에손: "무릎에 손",
    "pose_무릎에 손": "무릎에 손",
    
    // Tutorial
    modal_tutorial_title: '사용 안내',
    
    // Startup
    modal_startup_title: "Commission Helper란?",
    startup_desc: "커미션 신청서 및 구도 지시서를 구성할 수 있는 제작 도구입니다.",
    startup_sub_desc_1: "추가 안내는 상단 헤더의 책 아이콘(",
    startup_sub_desc_2: ") 또는<br>아래 버튼을 통해 확인하실 수 있습니다.",
    btn_startup_tutorial: "사용 안내 보기",

    // Mobile Warning
    modal_mobile_title: "데스크톱 사용 권장",
    mobile_warn_desc: "이 웹앱은 <strong>데스크톱 환경에서의 사용을 권장</strong>합니다.",
    mobile_warn_li1: "마우스·키보드 기반 조작으로 설계되어, 터치 환경에서는 일부 기능이 정상적으로 작동하지 않을 수 있습니다.",
    mobile_warn_li2: "캔버스 편집, 레이어 조작, 속성 패널 등은 넓은 화면과 정밀한 포인팅 장치에 최적화되어 있습니다.",
    mobile_warn_li3: "더 나은 경험을 위해 <strong>PC 또는 태블릿(가로 모드)</strong>에서 이용해 주세요.",
    btn_mobile_ok: "알겠습니다",

    tut_h2_role: "📐 각 영역의 역할",
    tut_role_callout: "💡 좌측 캔버스와 우측 캐릭터 시트는 서로 완전히 별개입니다. 둘 다 함께 활용할 수도 있고, 필요한 한쪽만 작성하여 내보낼 수도 있습니다.",
    tut_role_li1: "<strong>좌측패널:</strong> 중앙 및 우측 패널 작성에 도움이 되는 도구 패널입니다.",
    tut_role_li2: "<strong>중앙 캔버스:</strong> 인물을 조작해 원하는 구도를 지정할 수 있습니다.",
    tut_role_li3: "<strong>구도 설명:</strong> 캔버스 하단의 [구도 설명] 패널을 통해 원하는 구도를 글로 적을 수 있습니다. 해당 패널을 접거나 펼치면 내보내는 이미지에도 반영됩니다.",
    tut_role_li4: "<strong>캐릭터 시트:</strong> 탭(A, B, C…)을 통해 캐릭터 시트를 작성하고 관리할 수 있습니다.",
    tut_h2_canvas: "🕹️ 중앙 캔버스 인물 조작",
    tut_canvas_li1: "<strong>이동 / 크기 / 회전:</strong> 일반 모드에서 인물을 드래그하면 인물 전체가 이동합니다. 인물의 테두리 핸들을 사용해 크기와 회전을 조절할 수 있습니다.",
    tut_canvas_li2: "<strong>포즈 편집:</strong> 인물을 한 번 클릭하거나 좌측 패널의 [관절 포즈] 모드를 선택하면 파란 관절 핸들이 나타나 포즈 편집 모드로 진입합니다. 관절 핸들을 드래그해 인물의 포즈를 조정할 수 있으며, 머리 파츠를 회전해 시선 방향도 변경할 수 있습니다.",
    tut_canvas_li3: "<strong>파츠 앞뒤 순서 (레이어) 변경:</strong> 포즈 편집 모드에서 특정 파츠(예: 팔)를 선택한 뒤, 좌측 패널의 레이어 버튼(앞으로/뒤로)을 누르면 겹침 순서를 바꿀 수 있습니다.",
    tut_canvas_li4: "<strong>포즈 복사/붙여넣기:</strong> 좌측 패널의 [포즈 복사]로 다른 인물에게 붙여넣을 수 있습니다.",
    tut_canvas_li5: "<strong>포즈 프리셋:</strong> 기존에 만들어 둔 포즈를 활용하거나, 직접 프리셋을 만들어 저장할 수 있습니다.",
    tut_canvas_warn1: "⚠️ <strong>포즈가 안 움직이고 인물 전체만 이동하거나 크기만 바뀌나요?</strong><br>인물을 한 번 클릭해 관절 핸들을 표시하거나, 좌측 패널에서 [관절 포즈] 모드를 선택해 보세요.",
    tut_canvas_warn2: "⚠️ <strong>팔이나 다리의 앞뒤 겹침이 이상한가요?</strong><br>포즈 편집 모드에서 해당 파츠를 선택한 뒤 좌측 레이어 버튼으로 순서를 조정해 보세요.",
    tut_h2_draw: "🖊️ 그리기 도구",
    tut_draw_li1: "<strong>선택:</strong> 좌측 패널에서 선택, 펜, 텍스트, 도형 등을 선택해 캔버스에 설명을 추가할 수 있습니다.",
    tut_h2_sheet: "📋 캐릭터 시트 작성하기",
    tut_sheet_li1: "<strong>이미지 슬롯:</strong> 빈 슬롯을 클릭해 이미지를 넣고, <strong>추가된 이미지를 다시 클릭하여 크롭(구도)을 수정</strong>할 수 있습니다.",
    tut_sheet_li2: "<strong>컬러파레트:</strong> 단색, 그라디언트, 도형 기능을 제공하며, 이미지를 넣을 수도 있습니다. 특이동공, 투톤 등의 색상 표현에 활용해보세요.",
    tut_sheet_li3: "<strong>자유 꾸미기:</strong> 시트 상단의 [이미지 추가], [텍스트 추가] 버튼 등으로 정해진 슬롯 외에도 시트의 빈 공간을 자유롭게 채울 수 있습니다. SD나 의상 설명 등을 추가하는 데 활용할 수 있습니다.",
    tut_h2_multi: "📑 다중 캐릭터 관리",
    tut_multi_li1: "우측 탭(A, B, C…)을 클릭해 캐릭터를 추가하고 탭을 위아래로 드래그해 순서를 바꿀 수 있습니다. 작성한 시트를 삭제할 수 있으며, 삭제한 시트는 복구할 수 없습니다.",
    tut_multi_li2: "시트 테마 색상을 변경해 전체 시트 분위기를 한 번에 바꿀 수 있습니다.",
    tut_h2_save: "💾 저장 &amp; 내보내기",
    tut_save_li1: "<strong>저장:</strong> [저장] 버튼으로 작업 전체를 .json 파일로 보관하고 언제든 다시 불러올 수 있습니다.",
    tut_save_li2: "<strong>내보내기:</strong> 상단 [내보내기]에서 전체 합본 / 캐릭터 시트만 / 포즈 캔버스만 등 원하는 부분만 선택해 이미지로 저장합니다.",
    tut_h2_a11y: "⌨️ 접근성 안내",
    tut_a11y_li1: "PC 환경에 맞춰 제작되었으며, 모바일에서는 정상적으로 사용할 수 없습니다.",
    tut_a11y_li2: "상단 메뉴 및 우측 정보 입력칸은 키보드(Tab)로 탐색할 수 있습니다.",
    tut_a11y_li3: "단, 캔버스의 구도 배치와 포즈 드래그 조작은 마우스 또는 펜 입력이 필요합니다."
  },
  
  en: {
    lang_name: "English",
    header_title: "Commission Helper - Commission Reference Sheet Maker",
    header_sub: "Commission Reference Sheet Maker",
    btn_tutorial_title: "Tutorial",
    btn_undo_title: "Undo (Ctrl+Z)",
    btn_redo_title: "Redo (Ctrl+Y)",
    
    btn_reset: " Reset",
    btn_load: " Load",
    btn_save: " Save",
    btn_save_preset: "Save",
    status_export_done: "Image export completed.",
    status_pose_copy: "Pose copied.",
    status_pose_paste: "Pose pasted.",
    status_item_del: "Item deleted.",
    status_char_add: "Character added.",
    status_img_add: "Image added.",
    status_reset: "All reset.",
    status_proj_save: "Project saved.",
    status_proj_load: "Project loaded.",
    btn_preview: "Preview",
    btn_export: "Export",
    export_scope: "Select Export Scope",
    export_scale: "Export Scale",
    opt_all: "🌟 Full Sheet (Pose + All Characters)",
    opt_all_split: "⚖️ Pose Canvas + Character Sheets (Side by Side)",
    opt_current: "👤 Current Character (Pose + Character Sheet)",
    opt_sheets: "📑 All Character Sheets (Combined)",
    opt_current_sheet: "📄 Current Character Sheet Only",
    opt_canvas: "🖼️ Pose Canvas Only",
    
    panel_canvas: "Canvas",
    lbl_ratio: "Aspect Ratio",
    opt_sq: "Square (1:1)",
    opt_v34: "Vertical (3:4)",
    opt_v23: "Vertical (2:3)",
    opt_v916: "Vertical (9:16)",
    opt_h43: "Horizontal (4:3)",
    opt_h169: "Horizontal (16:9)",
    opt_h31: "Header (3:1)",
    opt_custom: "Custom",
    lbl_cw: "Width Ratio",
    lbl_ch: "Height Ratio",
    lbl_bg: "Canvas Background",
    
    panel_tools: "Tools",
    tool_select: "Select (V)",
    tool_pen: "Pen (P)",
    tool_eraser: "Eraser (E)",
    tool_text: "Text (T)",
    tool_arrow: "Arrow (A)",
    tool_rect: "Rectangle (R)",
    tool_circle: "Circle (C)",
    tool_img: "Insert Image",
    lbl_stroke_width: "Stroke Width",
    lbl_style: "Style",
    opt_style_stroke: "Default",
    opt_style_fill: "Fill (Shape Only)",
    opt_style_both: "Add Black Outline",
    opt_style_outline: "Add White Outline",
    
    panel_colors: "Colors",
    btn_eye_title: "Eyedropper",
    btn_add_char: "Add Character",
    
    comp_title: "Composition Notes",
    comp_pl: "- Describe the overall composition, camera angle, lighting, mood, etc.",
    
    lbl_sel_obj: "Selected Object",
    lbl_edit_mode: "Edit Mode",
    btn_mode_xform: "Transform All",
    btn_mode_pose: "Pose Editing",
    btn_flip: "Flip Horizontal",
    btn_reset_pose: "Reset Pose",
    btn_copy_pose: "Copy Pose",
    btn_paste_pose: "Paste Pose",
    
    lbl_part_sel: "Selected Part (Layer Order Only)",
    opt_part_all: "All",
    opt_part_head: "Head",
    opt_part_neck: "Neck",
    opt_part_chest: "Chest",
    opt_part_waist: "Waist",
    opt_part_pelvis: "Pelvis",
    opt_part_lUpperArm: "L Upper Arm",
    opt_part_lLowerArm: "L Lower Arm",
    opt_part_lHand: "L Hand",
    opt_part_rUpperArm: "R Upper Arm",
    opt_part_rLowerArm: "R Lower Arm",
    opt_part_rHand: "R Hand",
    opt_part_lThigh: "L Thigh",
    opt_part_lCalf: "L Calf",
    opt_part_lFoot: "L Foot",
    opt_part_rThigh: "R Thigh",
    opt_part_rCalf: "R Calf",
    opt_part_rFoot: "R Foot",
    
    lbl_layer_def: "Default",
    btn_layer_front: "Bring to Front",
    btn_layer_fwd: "Bring Forward",
    btn_layer_bwd: "Send Backward",
    btn_layer_back: "Send to Back",
    lbl_layer: "Layer",
    
    lbl_txt_content: "Text Content",
    pl_txt_content: "Enter text here",
    lbl_txt_size: "Font Size",
    txt_hint: "💡 Double-click text to edit directly",
    lbl_scale: "Size",
    btn_reset_scale: "Reset Size",
    btn_dup: "Duplicate",
    btn_del: "Delete",
    
    lbl_pose_presets: "Pose Presets",
    pose_apply: " Apply Pose",
    
    lbl_theme_link: "Link to Theme",
    lbl_theme_link_sub: "🔗 Link to Sheet Theme",
    lbl_theme_color: "Theme Colors",
    lbl_theme_hdr: "Header Bar Color",
    lbl_theme_sub_bg: "Subtitle Background Color",
    lbl_theme_bg: "Overall Background Color",
    lbl_theme_body: "Body Text Color",
    lbl_font_setting: "Text Settings",
    lbl_font_weight: "Font Weight",
    opt_fw_300: "Light",
    opt_fw_400: "Regular",
    opt_fw_500: "Medium",
    opt_fw_700: "Bold",
    btn_reset_val: "Reset to Defaults",
    
    tab_solid: "Solid Color",
    tab_grad: "Gradient",
    tab_img: "Image",
    tab_shape: "Draw",
    btn_reset_white: "Reset to White",
    lbl_dir: "Direction",
    dir_180: "Top → Bottom",
    dir_90: "Left → Right",
    dir_135: "↖ → ↘",
    dir_45: "↙ → ↗",
    lbl_color_stop: "Color Stop",
    btn_add_color: "Add Color",
    lbl_use_shape: "Use Shape Layer",
    btn_del_img_label: "Delete Image",
    
    sheet_orig_name: "Original Name",
    sheet_spec: "Height / Build",
    sheet_keyword: "#Keywords",
    sheet_keypoint_title: "Key Details",
    sheet_keypoint_pl: "Describe essential details that must be preserved.",
    sheet_feature_title: "Appearance",
    sheet_feature_sub: "Viewer's Perspective",
    sheet_feature_pl: "- Describe the character's appearance.",
    sheet_source: "References:",
    sheet_source_pl: "@nut__commission / Reference Credits",
    txt_watermark: "Template by @nut__guryoyo",
    title_creator: "Creator",
    btn_theme_font: "Theme/Font",
    btn_theme_font_title: "Theme & Font Settings for Description",
    
    lbl_drop_img: "Click or Drag",
    btn_theme_toggle: "Sheet Theme",
    btn_add_img: "Add Image",
    btn_add_text: "Add Text",
    
    btn_sheet_theme_title: "Apply theme colors to all sheets",
    btn_add_img_title: "Add floating image to panel",
    btn_add_text_title: "Add floating text to panel",
    lbl_theme_popup_title: "Sheet Theme Colors",
    lbl_link_dummy: "Sync with Dummy Colors",
    btn_apply_all_sheets: "Apply theme to all sheets",
    btn_apply: "Apply",
    lbl_theme_presets: "Theme Presets",
    lbl_theme_custom: "Custom Colors",
    lbl_theme_main: "Main Theme",
    lbl_theme_sub: "Sub BG",
    lbl_theme_title_txt: "Title Text",
    lbl_theme_body_txt: "Body Text",
    lbl_theme_sheet_bg: "Sheet BG",
    btn_reset_theme_charcoal: "Reset to Default Charcoal Theme",
    
    btn_apply_done: "Done",
    btn_apply_title: "Applies the current theme to all character sheets.",
    
    btn_close: "Close",
    btn_close_title: "Close",
    btn_close_preview_aria: "Close Preview",
    btn_close: "Close",
    btn_close_title: "Close",
    btn_close_preview_aria: "Close Preview",
    btn_close_crop_aria: "Close Crop Window",
    
    modal_preview_title: "Export Preview",
    btn_save: "Save",
    lbl_stroke_w: "Stroke / Border Width",
    lbl_style: "Style",
    opt_style_stroke: "Default",
    opt_style_fill: "Fill (Shape Only)",
    opt_style_both: "Add Black Border",
    opt_style_outline_white: "Add White Border",
    lbl_txt_content: "Text Content",
    lbl_txt_size: "Font Size",
    txt_edit_hint: "Double-click text to edit directly",
    btn_fold_comp_title: "Toggle Composition Note",
    tab_char_sheet_title: "Character {0}. Sheet (Drag to reorder)",
    tab_char_sheet_aria: "Character {0} Sheet",
    msg_del_char_sheet: "Are you sure you want to delete Character [ {0} ] sheet?<br>All profile text and uploaded images will be deleted.",
    msg_max_char: "You can add up to 8 character sheets.",
    txt_input_default: "Enter text",
    btn_layer_fwd: "Bring Forward",
    btn_layer_bwd: "Send Backward",
    btn_layer_back: "Send to Back",
    btn_del: "Delete",
    lbl_layer: "Layer",
    lbl_part_sel: "Selected Part (Layer Only)",
    btn_add_char: "Add Dummy",
    btn_add_char_title: "Add New Character Sheet",
    txt_watermark: "Template @nut__guryoyo",
    title_creator: "Creator",
    lbl_theme_bg: "Canvas BG Color",
    sheet_orig_name: "Native Name",
    sheet_keyword: "#Keywords",
    sheet_keypoint_pl: "Please describe any essential traits.",
    sheet_feature_title: "Appearance",
    sheet_feature_pl: "- Please describe the appearance.",
    sheet_spec: "Height / Build",
    btn_align_toggle: "Toggle Text Alignment (L/C/R)",
    txt_resolution: "Output Resolution: ",
    scope_all: "All Combined",
    scope_all_split: "Split Canvas in Half",
    scope_current: "Current Dummy",
    scope_sheets_only: "Sheets Only",
    scope_current_sheet: "Current Sheet Only",
    scope_pose_only: "Pose Only",
    lbl_slot_bg: "Slot BG Color",
    btn_remove_img_title: "Remove Image",
    btn_reset_rot_title: "Reset Rotation to 0°",
    btn_reset_scale_title: "Reset Scale to 100%",
    btn_replace_img_title: "Replace Image",
    btn_bg_color_title: "Background Color",
    title_reset_0: "Click to reset to 0°",
    lbl_scale: "Scale",
    lbl_pose_presets: "Pose Presets",
    
    theme_mono: "Mono Charcoal",
    theme_rose: "Rose Pink",
    theme_ocean: "Ocean Blue",
    theme_sage: "Sage Green",
    theme_purple: "Lavender Purple",
    theme_mint: "Aqua Mint",
    theme_honey: "Honey Beige",
    theme_mocha: "Mocha Brown",
    
    tool_font_dec: "Decrease Font Size",
    tool_font_inc: "Increase Font Size",
    tool_font_bold: "Bold Selection / All",
    tool_font_italic: "Italic Selection / All",
    tool_font_bullet: "Insert Bullet Points",
    tool_font_reset: "Reset Formatting",
    
    btn_rot_drag: "Drag to Rotate",
    btn_text_style: "Text Style/Format",
    btn_layer_front: "Bring to Front",
    btn_layer_back: "Send to Back",
    btn_text_bold: "Bold",
    btn_text_bold_label: "B (Bold)",
    tab_color: "Color",
    tab_color_title: "Solid Color",
    tab_grad: "Grad",
    tab_grad_title: "Gradient",
    tab_img: "Image",
    tab_img_title: "Image",
    tab_draw: "Shape",
    tab_draw_title: "Draw Shape",
    lbl_direction: "Dir",
    lbl_color: "Clr",
    btn_remove_this_color: "Remove this color",
    lbl_size: "Size",
    btn_remove_img: "Remove Image",
    lbl_shape_layer: "Enable Shape Layer",
    lbl_shape: "Shp",
    shape_circle: "Filled Circle",
    shape_oval: "Vertical Oval (Pupil)",
    shape_ring: "Ring (Outline)",
    shape_dot: "Small Dot",
    shape_bullseye: "Bullseye (◎)",
    shape_sparkle: "Sparkle (✦)",
    btn_panel_expand: "Expand Panel",
    btn_panel_collapse: "Collapse Panel",
    btn_comp_expand: "Expand Composition",
    btn_comp_collapse: "Collapse Composition",
    
    msg_need_char: "Please select a character before applying a pose.",
    msg_reset_warn: "Are you sure you want to reset everything?<br>All data will be lost.",
    msg_del_img: "Are you sure you want to delete this image?",
    msg_del_preset: 'Are you sure you want to delete the "{0}" preset?',
    btn_del_preset: "Delete Preset",
    title_save_preset: "Save currently selected pose to this slot",
    msg_input_preset: "Please enter a new preset name:",
    
    badge_fwd: "Fwd",
    badge_bwd: "Bwd",
    badge_overtake: " Overtaken",
    badge_behind: " Behind",
    badge_th: "th",
    
    modal_confirm_title: "Confirm",
    modal_prompt_title: "Input",
    modal_alert_title: "Alert",
    btn_cancel: "Cancel",
    btn_ok: "OK",
    
    btn_reset_title: "Reset",
    btn_load_title: "Load Project",
    btn_save_title: "Save Project",
    btn_preview_title: "Preview Export Image",
    btn_export_aria: "Export Image",
    btn_reset_layer: "Reset Layer Offset",
    
    "pose_기본 스탠딩1": "Basic Standing (1)",
    "pose_기본 스탠딩2": "Basic Standing (2)",
    "pose_기본 스탠딩3": "Basic Standing (3)",
    pose_주머니손: "Hands in Pockets",
    "pose_주머니 손": "Hands in Pockets",
    pose_팔짱낌: "Arms Crossed",
    "pose_팔짱 낌": "Arms Crossed",
    pose_양손모음: "Hands Together",
    pose_목에손1: "Hand on Neck (1)",
    "pose_목에 손 1": "Hand on Neck (1)",
    pose_목에손2: "Hand on Neck (2)",
    "pose_목에 손 2": "Hand on Neck (2)",
    "pose_강하고 이상한놈": "Strong & Weird Pose",
    pose_팔스트레칭: "Arm Stretch",
    "pose_팔 스트레칭": "Arm Stretch",
    pose_무릎에손: "Hands on Knees",
    "pose_무릎에 손": "Hands on Knees",
    
    // Tutorial
    modal_tutorial_title: 'Tutorial',

    // Startup
    modal_startup_title: "What is Commission Helper?",
    startup_desc: "A creation tool to easily set up commission request forms and pose compositions.",
    startup_sub_desc_1: "For more details, click the book icon (",
    startup_sub_desc_2: ") in the header or the button below.",
    btn_startup_tutorial: "View Tutorial",

    // Mobile Warning
    modal_mobile_title: "Desktop Recommended",
    mobile_warn_desc: "This web app is <strong>recommended for desktop environments</strong>.",
    mobile_warn_li1: "Designed for mouse and keyboard. Some features may not work properly on touch devices.",
    mobile_warn_li2: "Canvas editing, layer controls, and property panels are optimized for larger screens and precise pointing devices.",
    mobile_warn_li3: "For the best experience, please use a <strong>PC or tablet (landscape)</strong>.",
    btn_mobile_ok: "I Understand",
    
    tut_h2_role: "📐 Role of Each Area",
    tut_role_callout: "💡 The left canvas and the right character sheet are completely independent. You can use both together, or fill out and export only the one you need.",
    tut_role_li1: "<strong>Left Panel:</strong> Tools for editing the canvas and character sheets.",
    tut_role_li2: "<strong>Center Canvas:</strong> You can manipulate the figure to set your desired pose and composition.",
    tut_role_li3: "<strong>Composition Notes:</strong> You can write down your desired composition in the [Composition Notes] panel at the bottom of the canvas. Expanding or collapsing this panel will also reflect in the exported image.",
    tut_role_li4: "<strong>Character Sheet:</strong> You can create and manage character sheets using the tabs (A, B, C...).",
    tut_h2_canvas: "🕹️ Adjusting Figures on the Canvas",
    tut_canvas_li1: "<strong>Move / Resize / Rotate:</strong> In normal mode, click and drag the figure to move it. Use the handles around the figure to adjust its size and rotation.",
    tut_canvas_li2: "<strong>Edit Pose:</strong> Click the figure once or select [Pose Editing] mode on the left panel to reveal blue joint handles and enter pose-edit mode. Drag the joint handles to adjust the pose, and rotate the head part to adjust the gaze direction.",
    tut_canvas_li3: "<strong>Change Layer Order:</strong> While in pose-edit mode, select a specific part (e.g., arm) and click the layer buttons (Forward/Backward) on the left panel to change the overlapping order.",
    tut_canvas_li4: "<strong>Copy/Paste Pose:</strong> Use [Copy Pose] on the left panel to copy and paste the pose to another figure.",
    tut_canvas_li5: "<strong>Pose Presets:</strong> Apply pre-made poses or create and save your own custom pose presets.",
    tut_canvas_warn1: "⚠️ <strong>Pose won't move, and only the whole figure moves or resizes?</strong><br>Click the figure once to reveal the joint handles, or select [Pose Editing] mode on the left panel.",
    tut_canvas_warn2: "⚠️ <strong>Arm/leg layering looks weird!</strong><br>While in pose-edit mode, select the part and try using the layer buttons on the left panel.",
    tut_h2_draw: "🖊️ Drawing Tools",
    tut_draw_li1: "<strong>Select:</strong> Choose Select, Pen, Text, or Shape tools from the left panel to add annotations to the canvas.",
    tut_h2_sheet: "📋 Creating Character Sheets",
    tut_sheet_li1: "<strong>Image Slots:</strong> Click an empty slot to insert an image. <strong>Click the inserted image again to edit its crop/position.</strong>",
    tut_sheet_li2: "<strong>Color Tab:</strong> Supports solid colors, gradients, and shapes, and you can also insert images. Use it to express unique features like heterochromia or two-tone hair.",
    tut_sheet_li3: "<strong>Freeform Customization:</strong> Use [Add Image] or [Add Text] buttons at the top of the sheet to freely fill empty spaces outside the designated slots. Useful for adding chibi references or outfit descriptions.",
    tut_h2_multi: "📑 Managing Multiple Characters",
    tut_multi_li1: "Click the right tabs (A, B, C...) to add characters, and drag tabs up/down to reorder them. You can delete sheets, but deleted sheets cannot be recovered.",
    tut_multi_li2: "Change the sheet theme color to update its overall look.",
    tut_h2_save: "💾 Save &amp; Export",
    tut_save_li1: "<strong>Save:</strong> Use the [Save] button to keep your entire project as a .json file and load it back anytime.",
    tut_save_li2: "<strong>Export:</strong> Click [Export] at the top to save specific parts as images, such as the full combined sheet, character sheets only, or pose canvas only.",
    tut_h2_a11y: "⌨️ Accessibility Info",
    tut_a11y_li1: "This tool is designed for PC and may not work properly on mobile devices.",
    tut_a11y_li2: "The top menu and right information input fields can be navigated using the keyboard (Tab).",
    tut_a11y_li3: "However, canvas composition and pose dragging require a mouse or pen input."
  }
};

let currentLang = localStorage.getItem('commission_lang');
if (!currentLang) {
  const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
  currentLang = (browserLang === 'ko') ? 'ko' : 'en';
}

window.t = function(key) {
  return I18N_DICT[currentLang]?.[key] || I18N_DICT['ko'][key] || key;
}

function applyI18nToElement(el) {
  if (el.hasAttribute('data-i18n')) {
    const key = el.getAttribute('data-i18n');
    if (key && window.t(key) !== key) {
      if (el.innerHTML.includes('<i class=')) {
         let iconHtml = el.innerHTML.match(/<i[^>]*><\/i>/);
         if (iconHtml) {
             const needsSpace = key === 'btn_preview' || key === 'btn_export' || key.startsWith('panel_') || key.startsWith('modal_') || key === 'btn_add_char' || key === 'btn_add_color' || key === 'btn_theme_toggle' || key === 'btn_add_img' || key === 'btn_add_text' || key === 'btn_del_img_label' || key === 'btn_mode_xform' || key === 'btn_mode_pose' || key === 'btn_flip' || key === 'btn_reset_pose' || key === 'btn_copy_pose' || key === 'btn_paste_pose' || key === 'btn_dup' || key === 'btn_del';
             el.innerHTML = iconHtml[0] + (needsSpace ? ' ' + window.t(key) : window.t(key));
         } else {
             el.innerHTML = window.t(key);
         }
      } else {
         el.innerHTML = window.t(key);
      }
    }
  }
  
  if (el.hasAttribute('data-i18n-title')) {
    const key = el.getAttribute('data-i18n-title');
    if (key && window.t(key) !== key) {
      el.setAttribute('title', window.t(key));
    }
  }
  
  if (el.hasAttribute('data-i18n-aria')) {
    const key = el.getAttribute('data-i18n-aria');
    if (key && window.t(key) !== key) {
      el.setAttribute('aria-label', window.t(key));
    }
  }
  
  if (el.hasAttribute('data-i18n-placeholder')) {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && window.t(key) !== key) {
      el.setAttribute('placeholder', window.t(key));
      
      if (el.classList.contains('cs-block-textarea')) {
        const koVal = I18N_DICT.ko[key];
        const enVal = I18N_DICT.en[key];
        let currentText = el.innerHTML.replace(/<br>/g, '\n').trim();
        
        const isKoDef = currentText === koVal.replace(/<br>/g, '\n').trim() || currentText === koVal.repeat(4).trim() || currentText === [koVal,koVal,koVal,koVal].join('\n');
        const isEnDef = currentText === enVal.replace(/<br>/g, '\n').trim() || currentText === enVal.repeat(4).trim() || currentText === [enVal,enVal,enVal,enVal].join('\n');
        
        if (isKoDef || isEnDef || !currentText) {
          if (key === 'sheet_feature_pl') {
            el.innerHTML = `${window.t(key)}<br>${window.t(key)}<br>${window.t(key)}<br>${window.t(key)}`;
          } else {
            el.textContent = window.t(key);
          }
        }
      }
    }
  }
}

function applyI18n() {
  const langSelect = document.getElementById('lang-select');
  if (langSelect) langSelect.value = currentLang;

  document.querySelectorAll('[data-i18n], [data-i18n-title], [data-i18n-aria], [data-i18n-placeholder]').forEach(el => {
    applyI18nToElement(el);
  });
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('commission_lang', lang);
  applyI18n();
}

window.addEventListener('DOMContentLoaded', () => {
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !document.getElementById('lang-select')) {
    const langWrapper = document.createElement('div');
    langWrapper.style.marginRight = '12px';
    langWrapper.style.display = 'inline-flex';
    langWrapper.style.alignItems = 'center';
    langWrapper.style.gap = '4px';
    
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-globe';
    icon.style.color = 'var(--c-text-muted)';
    
    const select = document.createElement('select');
    select.id = 'lang-select';
    select.style.padding = '4px 6px';
    select.style.borderRadius = '6px';
    select.style.border = '1px solid var(--c-border)';
    select.style.background = 'var(--c-panel)';
    select.style.color = 'var(--c-text)';
    select.style.fontSize = '12px';
    select.style.fontWeight = '600';
    select.style.cursor = 'pointer';
    select.style.outline = 'none';
    
    Object.keys(I18N_DICT).forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = I18N_DICT[k].lang_name;
      select.appendChild(opt);
    });
    
    select.value = currentLang;
    select.addEventListener('change', (e) => setLanguage(e.target.value));
    
    langWrapper.appendChild(icon);
    langWrapper.appendChild(select);
    
    headerActions.insertBefore(langWrapper, headerActions.firstChild);
  }
  
  applyI18n();
});

const observer = new MutationObserver((mutations) => {
  let shouldApply = false;
  mutations.forEach(m => {
    if (m.addedNodes.length > 0) {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.hasAttribute && (node.hasAttribute('data-i18n') || node.hasAttribute('data-i18n-title') || node.hasAttribute('data-i18n-placeholder'))) {
             applyI18nToElement(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll('[data-i18n], [data-i18n-title], [data-i18n-aria], [data-i18n-placeholder]').forEach(el => {
              applyI18nToElement(el);
            });
          }
        }
      });
    }
  });
});

window.addEventListener('load', () => {
  observer.observe(document.body, { childList: true, subtree: true });
});
