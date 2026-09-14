export default function RefundPolicyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f2e8",
        color: "#13233d",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "#fffdf8",
          border: "1px solid #e4dac8",
          borderRadius: 20,
          padding: "48px 32px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ marginBottom: 36 }}>
          <div
            style={{
              fontSize: 13,
              letterSpacing: 2,
              color: "#b88732",
              marginBottom: 12,
            }}
          >
            MYEONGUN POLICY
          </div>

          <h1
            style={{
              fontSize: 34,
              lineHeight: 1.3,
              margin: 0,
              marginBottom: 14,
            }}
          >
            환불 및 취소 정책
          </h1>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.8,
            }}
          >
            명운 유료 사주 분석 서비스의 결제 취소 및 환불 기준을 안내드립니다.
          </p>
        </div>

        <section style={{ marginBottom: 34 }}>
          <h2 style={{ fontSize: 21, marginBottom: 14 }}>
            1. 서비스의 성격
          </h2>
          <p style={{ lineHeight: 1.9, color: "#344054" }}>
            명운의 유료 상세 사주 분석은 이용자가 입력한 생년월일,
            출생시간 등의 정보를 바탕으로 분석 결과를 온라인으로 제공하는
            디지털 콘텐츠 서비스입니다.
          </p>
        </section>

        <section style={{ marginBottom: 34 }}>
          <h2 style={{ fontSize: 21, marginBottom: 14 }}>
            2. 결제 취소 및 환불
          </h2>
          <p style={{ lineHeight: 1.9, color: "#344054" }}>
            결제 후 아직 유료 상세 분석 결과가 제공되지 않은 경우에는
            결제 취소 또는 환불을 요청하실 수 있습니다.
          </p>
          <p style={{ lineHeight: 1.9, color: "#344054" }}>
            유료 상세 분석 결과가 정상적으로 제공되어 디지털 콘텐츠의
            이용이 시작된 이후에는 관련 법령에서 정한 경우를 제외하고
            단순 변심에 의한 환불이 제한될 수 있습니다.
          </p>
        </section>

        <section style={{ marginBottom: 34 }}>
          <h2 style={{ fontSize: 21, marginBottom: 14 }}>
            3. 서비스 오류 또는 미제공
          </h2>
          <p style={{ lineHeight: 1.9, color: "#344054" }}>
            결제가 완료되었으나 시스템 오류 등으로 유료 상세 분석 결과가
            정상적으로 제공되지 않은 경우, 고객센터 확인 후 재제공 또는
            환불을 진행합니다.
          </p>
        </section>

        <section style={{ marginBottom: 34 }}>
          <h2 style={{ fontSize: 21, marginBottom: 14 }}>
            4. 환불 처리 방법
          </h2>
          <p style={{ lineHeight: 1.9, color: "#344054" }}>
            환불 요청은 명운 고객센터 또는 이메일을 통해 접수할 수 있으며,
            결제 내역과 서비스 이용 여부를 확인한 후 처리합니다.
          </p>
          <p style={{ lineHeight: 1.9, color: "#344054" }}>
            환불 승인 후 실제 환급 시점은 결제수단 및 카드사, 금융기관의
            처리 일정에 따라 차이가 있을 수 있습니다.
          </p>
        </section>

        <section style={{ marginBottom: 34 }}>
          <h2 style={{ fontSize: 21, marginBottom: 14 }}>
            5. 고객센터
          </h2>
          <p style={{ lineHeight: 1.9, color: "#344054" }}>
            운영사: (주)오르디
            <br />
            고객센터: 02-6085-5868
            <br />
            운영시간: 평일 10:00~16:00
            <br />
            이메일: ordi79134@daum.net
          </p>
        </section>

        <section
          style={{
            borderTop: "1px solid #e4dac8",
            paddingTop: 24,
            color: "#667085",
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          본 정책은 관계 법령 및 서비스 운영 정책에 따라 변경될 수 있습니다.
          <br />
          시행일: 2026년 9월 14일
        </section>
      </div>
    </main>
  );
}