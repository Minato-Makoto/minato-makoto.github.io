/* =========================================================================
   MINATO MAKOTO — CANONICAL 13-NODE SPATIAL DATASET & SCHEMATIC GENERATOR
   ========================================================================= */
(function (global) {
  'use strict';

  const CAM_STATION_DIST = 535;

  const NODES = [
    {
      id: 'genesis-node',
      code: '00',
      year: '1997—2026',
      category: 'GENESIS // FULL-STACK IDENTITY',
      title: 'Lương Bảo Huy (Minato Makoto)',
      role: 'Senior Designer · Video Editor · Photographer · Video Producer',
      client: 'Medihub → Bee Nguyen → The Fool → Uplive → Masthead → Tebi',
      routes: ['all', 'dossier', 'producer', 'post'],
      overviewPos: { x: -410, y: 420, z: 0, ry: 0.12 },
      journeyPos:  { x: -120, y: -4,  z: 0, ry: 0.08 },
      accent: '#ff4425',
      mediaType: 'sheet',
      sheetHtml: `
        <div class="node-data-sheet">
          <div>
            <div class="sheet-head-anim">
              <h3 data-text-fx="cipher">Lương Bảo Huy (Minato Makoto) · 29.03.1997</h3>
              <p>“Work hard, play hard is my modus operandi. I immerse myself in my work with the same passion and dedication a child has for their toys and games.”</p>
            </div>
            <div class="sheet-grid">
              <div class="sheet-cell" style="--cell-i:0"><b>2015 – 2016 · Medihub</b><span>Media Intern</span></div>
              <div class="sheet-cell" style="--cell-i:1"><b>2016 – 2017 · bee nguyen</b><span>Photographer</span></div>
              <div class="sheet-cell" style="--cell-i:2"><b>2017 – Now · The Fool</b><span>Freelance Photographer</span></div>
              <div class="sheet-cell" style="--cell-i:3"><b>2018 – 2019 · Uplive</b><span>Designer &amp; Talent Manager</span></div>
              <div class="sheet-cell" style="--cell-i:4"><b>2019 – 2022 · Masthead</b><span>Video Producer Assistant</span></div>
              <div class="sheet-cell" style="--cell-i:5"><b>2022 – 2024 · tebi</b><span>Full-Stack Designer</span></div>
            </div>
          </div>
          <div class="sheet-skills-bars">
            <div class="skill-meter">
              <div class="skill-meter-top"><span>Designer</span><i data-text-fx="telemetry">98%</i></div>
              <div class="skill-track"><div class="skill-fill" style="--pct:98%"></div></div>
            </div>
            <div class="skill-meter">
              <div class="skill-meter-top"><span>Generalist</span><i data-text-fx="telemetry">98%</i></div>
              <div class="skill-track"><div class="skill-fill" style="--pct:98%"></div></div>
            </div>
            <div class="skill-meter">
              <div class="skill-meter-top"><span>Photo</span><i data-text-fx="telemetry">92%</i></div>
              <div class="skill-track"><div class="skill-fill" style="--pct:92%"></div></div>
            </div>
            <div class="skill-meter">
              <div class="skill-meter-top"><span>Post/VFX</span><i data-text-fx="telemetry">88%</i></div>
              <div class="skill-track"><div class="skill-fill" style="--pct:88%"></div></div>
            </div>
            <div class="skill-meter">
              <div class="skill-meter-top"><span>Producer</span><i data-text-fx="telemetry">82%</i></div>
              <div class="skill-track"><div class="skill-fill" style="--pct:82%"></div></div>
            </div>
          </div>
        </div>
      `,
      greeting: 'Chào người lạ, chào mừng đến với thế giới Full-Stack Designer của Minato-sama (Lương Bảo Huy — 29.03.1997). Từ đây người xem có thể cuộn mượt dọc trục Z hoặc chọn các nhánh hội thoại bên dưới.',
      roleDetail: 'Khởi đầu từ Nhiếp ảnh gia (Medihub, Bee Nguyen, The Fool Photography) rồi mở rộng sang Graphic Designer & Talent Manager (Uplive), Video Producer Assistant (Masthead) và Full-Stack Designer (tebi).',
      techDetail: 'Điểm mạnh cốt lõi của Minato là khả năng đảm đương trọn gói cả Tiền kỳ (concept, kịch bản, điều phối đoàn quay & thiết bị) lẫn Hậu kỳ (Editing, Color Grading, VFX, Key Visual Manipulation).'
    },
    {
      id: 'harmony-card',
      code: '01',
      year: '2025',
      category: 'FLAGSHIP // FULL OWNERSHIP',
      title: 'Harmony 2025 – Better With You',
      role: 'Producer · Project Owner · Post Supervisor',
      client: 'Harmony VN',
      routes: ['all', 'producer'],
      overviewPos: { x: -125, y: 315, z: -10, ry: 0.09 },
      journeyPos:  { x: -125, y: 4,   z: -900, ry: 0.08 },
      accent: '#ff4425',
      mediaType: 'drive',
      link: 'https://drive.google.com/file/d/1X-_4rjqvc4X_ZVYo5BYFDoEBzp_DtkwZ/view',
      greeting: 'Trạm 01 (Z:-900m) — "Harmony 2025: Better With You". Dự án tiêu biểu nhất cho vai trò Producer ∴ Project Owner làm chủ từ trang giấy trắng đến bản phim cuối cùng.',
      roleDetail: 'Minato trực tiếp nắm toàn bộ 3 giai đoạn: Tiền kỳ (ý tưởng, kịch bản, chuẩn bị sản xuất), On-set (đạo diễn sản xuất, giám sát ghi hình) và Hậu kỳ (dựng phim, chỉnh màu, hoàn thiện).',
      techDetail: 'Nhờ một người kiểm soát xuyên suốt từ kịch bản đến bàn dựng, bộ phim giữ được nhịp thở và bảng màu thống nhất tuyệt đối với ý đồ ban đầu.'
    },
    {
      id: 'daydream-card',
      code: '02',
      year: '2024',
      category: 'EVENT // OPTIMAL WORKFLOW',
      title: 'RECAP DAY DREAMS FINAL 2024!',
      role: 'Producer · Project Manager · Editor',
      client: 'Day Dreams · Trading Card Tournament',
      routes: ['all', 'producer'],
      overviewPos: { x: 160, y: 315, z: -15, ry: 0.06 },
      journeyPos:  { x: -115, y: -8, z: -1800, ry: 0.07 },
      accent: '#cfece6',
      mediaType: 'drive',
      link: 'https://drive.google.com/file/d/1PsYIUeHpntiBvQT1aYqrY8rd0KGJlU4B/view',
      greeting: 'Trạm 02 (Z:-1800m) — "RECAP DAY DREAMS FINAL 2024!". Minh chứng cho khả năng thích ứng và tối ưu hóa quy trình sản xuất trong bối cảnh kinh tế cuối năm 2024.',
      roleDetail: 'Đảm nhận vai trò Producer xuyên suốt từ lên ý tưởng, tổ chức ghi hình tại giải đấu đến hoàn thiện hậu kỳ cho chuỗi giải đấu của Day Dreams.',
      techDetail: 'Khi quay lại với hệ thiết bị gọn nhẹ cho các dự án tối ưu chi phí, Minato vẫn "cook" ra chất lượng hình ảnh và nhịp dựng bùng nổ làm hài lòng khách hàng.'
    },
    {
      id: 'hithegioi-card',
      code: '03',
      year: '2023',
      category: 'MUSIC VIDEO // ONE-MAN POST',
      title: 'BLACKA – Hi Thế Giới ft. ARTHUR',
      role: 'Post-Production Supervisor',
      client: 'BLACKA · VieNETWORK',
      routes: ['all', 'post'],
      overviewPos: { x: -410, y: 210, z: -20, ry: 0.12 },
      journeyPos:  { x: -125, y: -6, z: -2700, ry: 0.08 },
      accent: '#e2ab4b',
      mediaType: 'youtube',
      link: 'https://www.youtube.com/watch?v=wBWQsfxG4eE',
      greeting: 'Trạm 03 (Z:-2700m) — MV chính thức "Hi Thế Giới | No No No" (BLACKA ft. ARTHUR). Một chuẩn mực về năng lực One-Man Army trong hậu kỳ âm nhạc.',
      roleDetail: 'Toàn bộ khâu hậu kỳ do Minato độc lập thực hiện: nhận toàn bộ source raw sau khi quay, dựng offline/online, chỉnh màu và xử lý VFX.',
      techDetail: 'Mọi hiệu ứng chuyển cảnh và nhịp cắt đều bám chặt vào flow của nghệ sĩ, hoàn thành đúng tiến độ cam kết (2–4 tuần) và đạt sự đồng thuận tuyệt đối với creative board.'
    },
    {
      id: 'vib-itsher-node',
      code: '04',
      year: '2022—2024',
      category: 'BANKING & MULTI-BRAND // TEAM & KV',
      title: 'VIB “It’s Her” &amp; 2024 Brand Roster',
      role: 'Producer Assistant · Manipulation Designer',
      client: 'VIB · AIA Alpha · YBA · Nhạc Viện TP.HCM · VIFA',
      routes: ['all', 'dossier', 'producer'],
      overviewPos: { x: -125, y: 105, z: -30, ry: 0.09 },
      journeyPos:  { x: -115, y: 6, z: -3600, ry: 0.08 },
      accent: '#ff4425',
      mediaType: 'sheet',
      sheetHtml: `
        <div class="node-data-sheet">
          <div>
            <div class="sheet-head-anim">
              <h3 data-text-fx="cipher">Vietnam International Bank (VIB) &amp; 2024 Commercial Roster</h3>
              <p><strong>VIB — “It’s Her” (10-Event Series) &amp; Key Visual Manipulation:</strong> Hỗ trợ Producer Director lập kế hoạch &amp; phân bổ tác vụ toàn dự án; trực tiếp phỏng vấn Esther Nguyễn (POPS Worldwide), Hoàng Khánh (BLOOM), Đoàn Phương Ly (Thuyền Xưa) và thiết kế bộ KV Manipulation “Mở lối cho mọi thành công”.</p>
            </div>
            <div class="sheet-grid">
              <div class="sheet-cell" style="--cell-i:0"><b>ALPHA powered by AIA</b><span>Talking Stage Event &amp; Post</span></div>
              <div class="sheet-cell" style="--cell-i:1"><b>Nhạc Viện TP.HCM</b><span>Pianoforte Opus 1: Through The Ages</span></div>
              <div class="sheet-cell" style="--cell-i:2"><b>YBA TP.HCM (Gia Định)</b><span>Event Production &amp; Recap</span></div>
              <div class="sheet-cell" style="--cell-i:3"><b>VIFA EXPO · NORITER · BCVN</b><span>Multi-stage Pre &amp; Post Production</span></div>
            </div>
          </div>
          <div class="sheet-head-anim"><strong>Scope:</strong> Producer Assistant · Key Visual Manipulation · Event &amp; Institutional Video Production</div>
        </div>
      `,
      greeting: 'Trạm 04 (Z:-3600m) — Tổ hợp chiến dịch ngân hàng VIB ("It’s Her" & KV "Mở lối cho mọi thành công") cùng loạt dự án doanh nghiệp/học thuật năm 2024.',
      roleDetail: 'Tại VIB, Minato vừa là Producer Assistant điều phối tiến độ chuỗi 10 sự kiện toàn quốc và phỏng vấn 3 nữ CEO, vừa là Manipulation Designer thực hiện bộ Key Visual chân dung.',
      techDetail: 'Bên cạnh đó trong năm 2024, Minato còn phụ trách tiền kỳ & hậu kỳ cho ALPHA (AIA), Metro Group, YBA TP.HCM, Khoa Piano Nhạc Viện TP.HCM (Through The Ages), VIFA Expo và BCVN.'
    },
    {
      id: 'motor-fest-card',
      code: '05',
      year: '2023',
      category: 'HIGH-SPEED RECAP // SOLO POST',
      title: 'Motor Fest 2023',
      role: 'Post-Production Supervisor',
      client: 'Motor Fest',
      routes: ['all', 'post'],
      overviewPos: { x: 160, y: 105, z: -35, ry: 0.06 },
      journeyPos:  { x: -125, y: -8, z: -4500, ry: 0.08 },
      accent: '#cfece6',
      mediaType: 'drive',
      link: 'https://drive.google.com/file/d/1LHlJL_vV7l8I4_F-JIutWN8wlMhoGaEn/view',
      greeting: 'Trạm 05 (Z:-4500m) — "Motor Fest 2023". Bài kiểm tra khắc nghiệt về tốc độ xử lý hậu kỳ độc lập dưới áp lực thời gian chồng chéo.',
      roleDetail: 'Một mình phụ trách toàn bộ dựng phim, hiệu ứng chuyển cảnh và âm thanh trong khi cân đối song song lịch trình công ty và dự án freelance.',
      techDetail: 'Biến áp lực deadline thành phản xạ dựng kinetic sắc gọn, giữ trọn nhịp độ sôi động của lễ hội mô-tô phân khối lớn.'
    },
    {
      id: 'doraemon-tvc-card',
      code: '06',
      year: '2021',
      category: 'COMMERCIAL TVC // IP & VFX',
      title: 'Doraemon × LipIce Sheer Color',
      role: 'Producer Assistant · VFX Editor',
      client: 'ROHTO · Doraemon 50th Anniversary',
      routes: ['all', 'producer', 'post', 'dossier'],
      overviewPos: { x: -410, y: 0, z: -40, ry: 0.12 },
      journeyPos:  { x: -115, y: 6, z: -5400, ry: 0.07 },
      accent: '#e2ab4b',
      mediaType: 'youtube',
      link: 'https://www.youtube.com/watch?v=7w3royxjrtw',
      greeting: 'Trạm 06 (Z:-5400m) — TVC thương mại "Doraemon LipIce Sheer Color" kỷ niệm 50 năm xuất bản bộ truyện Doraemon.',
      roleDetail: 'Tham gia với vai trò Producer Assistant kiêm VFX Editor, phối hợp chặt chẽ cùng công ty quản lý hình ảnh bản quyền Doraemon và nhãn hàng Rohto.',
      techDetail: 'Đảm bảo từng khung hình VFX, màu sắc sản phẩm và tạo hình nhân vật tuân thủ tuyệt đối quy trình thương mại quốc tế.'
    },
    {
      id: 'mv-le-card',
      code: '07',
      year: '2023',
      category: 'MUSIC VIDEO // RAW-TO-MASTER',
      title: 'MV Lé — Dr Roc',
      role: 'Post-Production Supervisor',
      client: 'Dr Roc',
      routes: ['all', 'post'],
      overviewPos: { x: -125, y: -105, z: -50, ry: 0.09 },
      journeyPos:  { x: -125, y: -8, z: -6300, ry: 0.08 },
      accent: '#ff4425',
      mediaType: 'drive',
      link: 'https://drive.google.com/file/d/1yeMXF7wVZBWE2W7VHUQvHY1k7gREsfjD/view',
      greeting: 'Trạm 07 (Z:-6300m) — "MV Lé – Dr Roc". Tác phẩm hậu kỳ toàn diện từ raw footage đến bản hoàn thiện cuối cùng.',
      roleDetail: 'Độc lập xử lý cả 3 mảng: Editing, Color Grading và Visual Effects (VFX) mà không cần chia nhỏ quy trình.',
      techDetail: 'Sự liền mạch giữa nhịp cắt, hiệu ứng thị giác và chất màu gai góc tạo nên dấu ấn cá nhân rõ nét cho MV.'
    },
    {
      id: 'dong-co-lau-card',
      code: '08',
      year: '2024',
      category: 'BRAND STORY // EMOTIONAL RHYTHM',
      title: 'ĐỒNG CỎ LAU – Từ Đất Trời Đến Tổ Ấm',
      role: 'Post-Production Supervisor',
      client: 'Đồng Cỏ Lau · AERO',
      routes: ['all', 'post'],
      overviewPos: { x: 160, y: -105, z: -55, ry: 0.06 },
      journeyPos:  { x: -115, y: 4, z: -7200, ry: 0.08 },
      accent: '#cfece6',
      mediaType: 'drive',
      link: 'https://drive.google.com/file/d/1cN1AkKCYtoxowWyVDofOIZlX4cZnrhGS/view',
      greeting: 'Trạm 08 (Z:-7200m) — Phim thương hiệu "ĐỒNG CỎ LAU: Hành trình từ đất trời đến tổ ấm".',
      roleDetail: 'Một mình gánh trọn khâu hậu kỳ: kết nối những thước phim thu hoạch bông lau nơi vách núi Tây Bắc hiểm trở với câu chuyện bàn tay người thợ và tổ ấm.',
      techDetail: 'Dựng theo mạch cảm xúc trầm lắng, bảng màu ấm áp giàu chất thơ, chạm đúng tinh thần thương hiệu.'
    },
    {
      id: 'ThaiLong-card',
      code: '09',
      year: '2023',
      category: 'CULINARY COMMERCIAL // SOLO POST',
      title: 'Thái Long Yến Tiệc',
      role: 'Post-Production Supervisor',
      client: 'Nước Mắm Thái Long',
      routes: ['all', 'post'],
      overviewPos: { x: -410, y: -210, z: -60, ry: 0.12 },
      journeyPos:  { x: -125, y: -8, z: -8100, ry: 0.08 },
      accent: '#e2ab4b',
      mediaType: 'drive',
      link: 'https://drive.google.com/file/d/1oFDR_ff0AHRXJuIFiQy8suxvZNKuA_Bg/view',
      greeting: 'Trạm 09 (Z:-8100m) — Phim quảng cáo ẩm thực "Thái Long Yến Tiệc".',
      roleDetail: 'Độc lập đảm trách toàn bộ quá trình hậu kỳ hình ảnh và âm thanh theo sát storyboard đã thống nhất với khách hàng.',
      techDetail: 'Từng khung hình món ăn và lớp âm thanh yến tiệc đều được trau chuốt tỉ mỉ để khơi gợi vị giác và không khí sum vầy.'
    },
    {
      id: 'microlife-bts-card',
      code: '10',
      year: '2021',
      category: 'PRODUCTION PROCESS // TALKSHOW BTS',
      title: 'Microlife Talkshow 2021 | BTS',
      role: 'Producer Assistant · Post Supervisor',
      client: 'Microlife · Masthead',
      routes: ['all', 'producer'],
      overviewPos: { x: -125, y: -315, z: -70, ry: 0.09 },
      journeyPos:  { x: -115, y: 6, z: -9000, ry: 0.07 },
      accent: '#cfece6',
      mediaType: 'youtube',
      link: 'https://www.youtube.com/watch?v=_V3pAcQBhPo',
      greeting: 'Trạm 10 (Z:-9000m) — "Microlife Talkshow 2021 BTS". Tư liệu sống động về năng lực tổ chức trường quay và vận hành quy trình sản xuất.',
      roleDetail: 'Hỗ trợ Executive Producer điều phối tiền kỳ, quản lý tiến độ tại trường quay và trực tiếp ghi hình/dựng phim Behind The Scenes.',
      techDetail: 'Phản ánh cách làm việc chuẩn xác, linh hoạt khi điều phối đồng thời đội ngũ kỹ thuật ánh sáng, máy quay và khách mời chuyên gia.'
    },
    {
      id: '2ndchance-card',
      code: '11',
      year: '2021',
      category: 'HEALTH CAMPAIGN // GENESIS TVC',
      title: 'The 2nd Chance – Hãy Thay Đổi Lối Sống',
      role: 'Producer Assistant · BTS',
      client: 'Microlife B3 AFIB',
      routes: ['all', 'producer'],
      overviewPos: { x: 160, y: -315, z: -75, ry: 0.06 },
      journeyPos:  { x: -125, y: -8, z: -9900, ry: 0.08 },
      accent: '#ff4425',
      mediaType: 'youtube',
      link: 'https://www.youtube.com/watch?v=5RVfxLfCHwg',
      greeting: 'Trạm 11 (Z:-9900m) — "The 2nd Chance: Hãy Thay Đổi Lối Sống". Dự án mở màn cho chuỗi chiến dịch truyền thông y tế của Microlife.',
      roleDetail: 'Tham gia ngay từ giai đoạn tiền kỳ với vai trò Producer Assistant, hỗ trợ Executive Producer giữ luồng vận hành hiện trường trơn tru và xử lý phát sinh.',
      techDetail: 'Tạo dựng quy trình phối hợp ăn ý làm tiền đề cho hàng loạt dự án TVC và talkshow sức khỏe kế tiếp.'
    },
    {
      id: 'PhongNguaDotQuy-card',
      code: '12',
      year: '2021—2026',
      category: 'CELEBRITY CAMPAIGN & DIRECT BOOKING',
      title: 'Phòng Ngừa Đột Quỵ &amp; Liên Hệ Hợp Tác',
      role: 'Producer Assistant · Direct Contact Terminal',
      client: 'Microlife × BIOMEQ (NSƯT Thành Lộc)',
      routes: ['all', 'producer', 'dossier'],
      overviewPos: { x: -410, y: -420, z: -80, ry: 0.12 },
      journeyPos:  { x: -120, y: 0, z: -10800, ry: 0.07 },
      accent: '#ff4425',
      mediaType: 'youtube',
      link: 'https://www.youtube.com/watch?v=PPNA0KnOrNg',
      greeting: 'Trạm cuối 12 (Z:-10800m) — Chiến dịch cùng NSƯT Thành Lộc & ThS.BS Trần Công Duy, đồng thời là Cổng Liên Hệ Trực Tiếp của Minato-sama.',
      roleDetail: 'Điều phối sản xuất và ghi hình BTS cùng nghệ sĩ lớn và bác sĩ chuyên khoa; khép lại hành trình 13 trạm trên trục Z.',
      techDetail: 'Thông tin kết nối trực tiếp Lương Bảo Huy (Minato Makoto): Email minatokiva@gmail.com | Điện thoại 0704 5555 27.'
    }
  ];

  // Procedural FUI Schematic Poster Generator scaled to 640x384
  function buildPosterSVG(node, index) {
    const seed = (index + 1) * 37;
    const g1 = (seed * 13) % 360;
    const rings = 3 + (index % 2);
    let ringMarkup = '';
    for (let r = 1; r <= rings; r++) {
      const rad = 40 * r + (index % 2) * 13;
      const dash = r % 2 === 0 ? '6 8' : '22 6 4 6';
      const spinClass = r % 2 === 0 ? 'orbit-ring-ccw' : 'orbit-ring-cw';
      ringMarkup += `<circle class="${spinClass}" cx="320" cy="192" r="${rad}" fill="none" stroke="${r === 1 ? node.accent : 'rgba(236,232,223,0.16)'}" stroke-width="${r === 1 ? 1.45 : 1}" stroke-dasharray="${dash}" />`;
    }

    let bars = '';
    for (let b = 0; b < 32; b++) {
      const x = 58 + b * 16.5;
      const h = 14 + ((b * seed * 7) % 72);
      const y = 192 - h / 2;
      const isHighlight = b % 6 === index % 6;
      bars += `<rect x="${x}" y="${y}" width="2.5" height="${h}" fill="${isHighlight ? node.accent : 'rgba(236,232,223,0.16)'}" />`;
    }

    return `
      <svg class="poster-art" viewBox="0 0 640 384" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="glow-${index}" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stop-color="${node.accent}" stop-opacity="0.22"/>
            <stop offset="65%" stop-color="#0b0b0a" stop-opacity="0.92"/>
            <stop offset="100%" stop-color="#070706" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="640" height="384" fill="url(#glow-${index})"/>
        <line x1="0" y1="192" x2="640" y2="192" stroke="rgba(236,232,223,0.1)" stroke-width="1"/>
        <line x1="320" y1="0" x2="320" y2="384" stroke="rgba(236,232,223,0.1)" stroke-width="1"/>
        <line x1="0" y1="0" x2="640" y2="384" stroke="rgba(236,232,223,0.04)" stroke-width="1"/>
        <line x1="640" y1="0" x2="0" y2="384" stroke="rgba(236,232,223,0.04)" stroke-width="1"/>
        ${ringMarkup}
        <g opacity="0.62">${bars}</g>
        <text x="22" y="32" fill="rgba(236,232,223,0.36)" font-family="IBM Plex Mono, monospace" font-size="9" letter-spacing="2">FRAME // ${node.code} · AZ ${g1}°</text>
        <text x="618" y="32" text-anchor="end" fill="${node.accent}" font-family="IBM Plex Mono, monospace" font-size="9" letter-spacing="1.5">Z:${node.journeyPos.z}m</text>
      </svg>
    `;
  }

  global.PortfolioData = {
    CAM_STATION_DIST,
    NODES,
    buildPosterSVG
  };
})(window);
