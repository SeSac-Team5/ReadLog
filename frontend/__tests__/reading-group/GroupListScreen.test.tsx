import React from 'react';
import { render } from '@testing-library/react-native';
import GroupListScreen from '../../src/screens/reading-group/GroupListScreen';
import { useMyGroups } from '../../src/hooks/reading-group/useGroups';

jest.mock('../../src/hooks/reading-group/useGroups');

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate, replace: jest.fn() } as any;

describe('GroupListScreen', () => {
  it('참여 모임 카드를 렌더링한다', () => {
    (useMyGroups as jest.Mock).mockReturnValue({
      groups: [
        {
          id: 1, name: '한강 읽기 모임', description: null,
          max_member: 8, member_count: 5,
          invite_code: 'RDLG-0001',
          start_date: null, end_date: null, created_at: '',
          book_id: null, owner_id: 1,
        },
      ],
      loading: false,
      refresh: jest.fn(),
    });

    const { getByText } = render(
      <GroupListScreen navigation={mockNavigation} route={{} as any} />
    );
    expect(getByText('한강 읽기 모임')).toBeTruthy();
    expect(getByText('5/8명')).toBeTruthy();
  });

  it('로딩 중에는 빈 FlatList를 보여준다', () => {
    (useMyGroups as jest.Mock).mockReturnValue({ groups: [], loading: true, refresh: jest.fn() });
    const { queryByText } = render(
      <GroupListScreen navigation={mockNavigation} route={{} as any} />
    );
    expect(queryByText('한강 읽기 모임')).toBeNull();
  });
});
