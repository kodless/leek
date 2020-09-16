import styled from 'styled-components';

const StickerWidgetWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background-color: #fff;
  border: 1px solid #333;
  border-radius: 8px;

  .leekIconWrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    flex-shrink: 0;
    background-color: rgba(0, 0, 0, 0.1);
    color: white;
    font-size: 30px;
    border-right: 1px solid gray;
  }

  .leekContentWrapper {
    width: 100%;
    padding: 10px 15px 10px 10px;
    display: flex;
    flex-direction: column;

    .leekStatNumber {
      font-size: 20px;
      font-weight: 500;
      line-height: 1.1;
      margin: 0 0 5px;
      color: #5e5e5e;
    }

    .leekLabel {
      font-size: 16px;
      font-weight: 400;
      margin: 0;
      line-height: 1.2;
      color: #333;
    }
  }
`;

export { StickerWidgetWrapper };
