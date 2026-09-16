package com.nguyendat.chatappserver.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nguyendat.chatappserver.dto.response.UserPresenceResponse;
import com.nguyendat.chatappserver.exception.GlobalExceptionHandler;
import com.nguyendat.chatappserver.service.PresenceService;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class PresenceControllerTest {

  @Mock PresenceService presenceService;

  @InjectMocks PresenceController controller;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc =
        MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
  }

  @Test
  void shouldReturnStatusesInServiceOrder() {
    Map<Long, Boolean> statuses = new LinkedHashMap<>();
    statuses.put(2L, true);
    statuses.put(3L, false);
    when(presenceService.getStatuses(List.of(2L, 3L))).thenReturn(statuses);

    var response = controller.getStatuses(List.of(2L, 3L));

    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().getData())
        .containsExactly(new UserPresenceResponse(2L, true), new UserPresenceResponse(3L, false));
  }

  @Test
  void shouldRejectMissingUserIdsAsBadRequest() throws Exception {
    mockMvc.perform(get("/users/presence")).andExpect(status().isBadRequest());
  }

  @Test
  void shouldRejectInvalidUserIdsAsBadRequest() throws Exception {
    mockMvc
        .perform(get("/users/presence").param("userIds", "-1"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void shouldRejectMoreThanOneHundredUserIdsAsBadRequest() throws Exception {
    String[] userIds =
        java.util.stream.LongStream.rangeClosed(1, 101)
            .mapToObj(String::valueOf)
            .toArray(String[]::new);

    mockMvc
        .perform(get("/users/presence").param("userIds", userIds))
        .andExpect(status().isBadRequest());
  }
}
