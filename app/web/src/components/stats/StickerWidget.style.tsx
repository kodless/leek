import styled from "styled-components";

const StickerWidgetWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid;
  border-radius: 8px;

  .leekIconWrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 70px;
    flex-shrink: 0;
    font-size: 25px;
    border-right: 1px solid gray;
  }

  .leekContentWrapper {
    width: 100%;
    padding: 7px 11px 7px 7px;
    display: flex;
    flex-direction: column;
  }
`;

export { StickerWidgetWrapper };
