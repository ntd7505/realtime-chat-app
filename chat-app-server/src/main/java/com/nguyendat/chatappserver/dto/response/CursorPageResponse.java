package com.nguyendat.chatappserver.dto.response;

import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CursorPageResponse<T> {
  List<T> items;
  String nextCursor;
  boolean hasNext;
}
